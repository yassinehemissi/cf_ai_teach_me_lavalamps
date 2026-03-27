import type { Camera, Scene, WebGLRenderer } from "three";
import type { EntropyWorkerRequest } from "@/workers/entropy/entropy.types";
import { extractEntropyFromBitmap } from "@/workers/entropy/entropy.utils";

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
  request: Omit<EntropyWorkerRequest, "requestId" | "sourceBitmap" | "type">,
) {
  await captureCurrentScene(gl, scene, camera);
  const [sourceBitmap, screenshotBlob] = await Promise.all([
    captureSceneBitmap(gl.domElement),
    captureSceneBlob(gl.domElement),
  ]);
  const screenshotUrl = URL.createObjectURL(screenshotBlob);

  try {
    const result = await extractEntropyFromBitmap({
      type: "extract-entropy",
      requestId: crypto.randomUUID(),
      sourceBitmap,
      ...request,
    });

    return {
      result,
      screenshotByteLength: screenshotBlob.size,
      screenshotUrl,
    };
  } catch (error) {
    URL.revokeObjectURL(screenshotUrl);
    throw error;
  }
}

async function captureSceneBitmap(canvas: HTMLCanvasElement) {
  if (typeof createImageBitmap !== "function") {
    throw new Error("createImageBitmap is unavailable for entropy capture.");
  }

  return createImageBitmap(canvas);
}

async function captureSceneBlob(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Scene capture did not produce a PNG blob.");
  }

  return blob;
}
