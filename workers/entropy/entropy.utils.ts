import type {
  EntropyWorkerRequest,
  EntropyWorkerResponse,
  EntropyWorkerSuccessResponse,
} from "./entropy.types";

let sharedEntropyWorker: Worker | null = null;

function createEntropyWorker() {
  return new Worker(new URL("./entropy.worker.ts", import.meta.url), {
    type: "module",
  });
}

function getSharedEntropyWorker() {
  if (sharedEntropyWorker) {
    return sharedEntropyWorker;
  }

  sharedEntropyWorker = createEntropyWorker();

  return sharedEntropyWorker;
}

export async function extractEntropyFromBitmap(
  request: EntropyWorkerRequest,
  worker?: Worker,
) {
  if (!(request.sourceBitmap instanceof ImageBitmap)) {
    throw new Error("Entropy worker request is missing a valid source bitmap.");
  }

  const usingSharedWorker = worker === undefined;
  const activeWorker = worker ?? getSharedEntropyWorker();
  const shouldTerminateWorker = !usingSharedWorker;

  return new Promise<EntropyWorkerSuccessResponse>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<EntropyWorkerResponse>) => {
      const response = event.data;

      if (response.requestId !== request.requestId) {
        return;
      }

      cleanup();

      if (response.type === "entropy-error") {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    };

    const handleError = (event: ErrorEvent) => {
      cleanup();
      reject(event.error ?? new Error(event.message));
    };

    const cleanup = () => {
      activeWorker.removeEventListener("message", handleMessage);
      activeWorker.removeEventListener("error", handleError);

      if (shouldTerminateWorker) {
        activeWorker.terminate();
      }
    };

    const transferables: Transferable[] = [];

    transferables.push(request.sourceBitmap);

    if (request.externalEntropyBytes) {
      transferables.push(request.externalEntropyBytes);
    }

    activeWorker.addEventListener("message", handleMessage);
    activeWorker.addEventListener("error", handleError);

    activeWorker.postMessage(request, transferables);
  });
}
