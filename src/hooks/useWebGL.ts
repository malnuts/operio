import { useMemo } from "react";

export type WebGLStatus = {
  supported: boolean;
};

export const useWebGL = (): WebGLStatus => {
  const supported = useMemo(() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  }, []);

  return { supported };
};
