import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { useWebGL } from "@/hooks/useWebGL";

// Firefox cannot fetch() or XHR blob: URLs created by GLTFLoader for
// embedded textures. ImageBitmapLoader (the default on modern Firefox)
// uses fetch() internally which fails on these URLs.
// Fix: patch GLTFLoader.parse to replace ImageBitmapLoader with
// TextureLoader on the internal parser. TextureLoader uses <img> elements
// which handle blob: URLs correctly in all browsers.
const _isFirefox =
  typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent);

if (_isFirefox) {
  const _origParse = GLTFLoader.prototype.parse;
  GLTFLoader.prototype.parse = function (
    data: ArrayBuffer | string,
    path: string,
    onLoad: (gltf: unknown) => void,
    onError?: (error: unknown) => void,
  ) {
    // Temporarily override the internal parser creation by wrapping
    // onLoad to never actually run on its own — instead we hook into
    // the parse call. But GLTFLoader doesn't expose the parser directly.
    // The simplest reliable approach: after calling original parse,
    // the parser is synchronously created and assigned textureLoader.
    // We can intercept by patching the manager's itemStart to detect
    // when texture loading begins and swap the loader.

    // Actually, the cleanest way: since GLTFLoader calls
    // `new GLTFParser(json, { manager: this.manager, ... })` which sets
    // `this.textureLoader` based on browser detection, we can override
    // by providing a manager with a URL modifier that doesn't change URLs
    // but whose reference we control, then the parser uses TextureLoader
    // if we make createImageBitmap unavailable temporarily.

    // Simplest approach: temporarily hide createImageBitmap so the parser
    // constructor falls back to TextureLoader.
    const saved = globalThis.createImageBitmap;
    globalThis.createImageBitmap = undefined as unknown as typeof createImageBitmap;
    try {
      _origParse.call(this, data, path, onLoad, onError);
    } finally {
      globalThis.createImageBitmap = saved;
    }
  };
}

export type ModelViewerProps = {
  modelPath: string;
  label?: string;
  description?: string;
};

type LoadState = "loading" | "ready" | "error";

const ModelViewerFallback = ({
  label,
  description,
  reason,
}: {
  label?: string;
  description?: string;
  reason: "no-webgl" | "load-error";
}) => (
  <div
    className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/40 p-8 text-center"
    data-testid="model-viewer-fallback"
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground text-2xl">
      {reason === "no-webgl" ? "⬡" : "△"}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">
        {label ?? "Visual reference"}
      </p>
      <p className="text-sm text-muted-foreground">
        {reason === "no-webgl"
          ? "3D rendering is not supported in this environment."
          : "The reference model could not be loaded."}
      </p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  </div>
);

const ModelViewer = ({ modelPath, label, description }: ModelViewerProps) => {
  const { supported } = useWebGL();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!supported || !containerRef.current) {
      return;
    }

    let active = true;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 3);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true,
      });
    } catch {
      setLoadState("error");
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8090ff, 0.3);
    fillLight.position.set(-3, -1, -2);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    // Load model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      `${import.meta.env.BASE_URL.replace(/\/$/, "")}/draco/`,
    );

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const onModelLoad = (gltf: { scene: THREE.Object3D }) => {
      if (!active) return;
      const model = gltf.scene;

      // Fit model to view
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / (maxDim || 1);
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      // Fix GLTF materials: BLEND mode sets depthWrite=false which causes
      // see-through artifacts. Re-enable depthWrite on all materials.
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const materials = Array.isArray((child as THREE.Mesh).material)
            ? (child as THREE.Mesh).material as THREE.Material[]
            : [(child as THREE.Mesh).material as THREE.Material];
          for (const mat of materials) {
            mat.depthWrite = true;
          }
        }
      });

      scene.add(model);
      controls.target.set(0, 0, 0);
      controls.update();
      setLoadState("ready");
    };

    loader.load(
      modelPath,
      onModelLoad,
      undefined,
      () => { if (active) setLoadState("error"); },
    );

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Render loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      active = false;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      dracoLoader.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [supported, modelPath]);

  if (!supported) {
    return (
      <ModelViewerFallback
        label={label}
        description={description}
        reason="no-webgl"
      />
    );
  }

  if (loadState === "error") {
    return (
      <ModelViewerFallback
        label={label}
        description={description}
        reason="load-error"
      />
    );
  }

  return (
    <div className="relative w-full" style={{ minHeight: 360 }}>
      {loadState === "loading" ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-muted/40"
          data-testid="model-viewer-loading"
        >
          <p className="text-sm text-muted-foreground">Loading reference model…</p>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: 360 }}
        data-testid="model-viewer-canvas"
        aria-label={label ? `3D reference model: ${label}` : "3D reference model"}
      />
    </div>
  );
};

export default ModelViewer;
