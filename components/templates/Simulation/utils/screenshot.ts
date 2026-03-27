import type { Camera, Scene, WebGLRenderer } from "three";
import type { EntropyWorkerRequest } from "@/workers/entropy/entropy.types";
import { extractEntropyFromDataUri } from "@/workers/entropy/entropy.utils";

export async function captureCurrentScene(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
) {
  camera.updateMatrixWorld(true);
  gl.render(scene, camera);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      gl.render(scene, camera);
      resolve();
    });
  });
}

export async function extractSceneEntropy(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  request: Omit<EntropyWorkerRequest, "dataUri" | "requestId" | "type">,
) {
  await captureCurrentScene(gl, scene, camera);
  const dataUri = gl.domElement.toDataURL("image/png");

  if (!isValidPngDataUri(dataUri)) {
    throw new Error("Scene capture did not produce a valid PNG data URI.");
  }

  const result = await extractEntropyFromDataUri({
    type: "extract-entropy",
    requestId: crypto.randomUUID(),
    dataUri,
    ...request,
  });

  return {
    dataUri,
    result,
  };
}

export function downloadScreenshot(dataUrl: string) {
  const anchor = document.createElement("a");

  anchor.href = dataUrl;
  anchor.download = `lava-lamp-simulation-${Date.now()}.png`;
  anchor.click();
}

function isValidPngDataUri(dataUri: string) {
  return (
    dataUri.startsWith("data:image/png") &&
    dataUri.includes(",") &&
    dataUri.length > 64
  );
}
