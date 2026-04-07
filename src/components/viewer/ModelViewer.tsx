import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { useWebGL } from "@/hooks/useWebGL";

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

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 0, 3);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // Fit model to view
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / (maxDim || 1);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);
        controls.target.set(0, 0, 0);
        controls.update();
        setLoadState("ready");
      },
      undefined,
      () => {
        setLoadState("error");
      },
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
