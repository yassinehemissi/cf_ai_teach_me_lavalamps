import type {
  EntropyWorkerRequest,
  EntropyWorkerResponse,
  EntropyWorkerSuccessResponse,
} from "./entropy.types";

export function createEntropyWorker() {
  return new Worker(new URL("./entropy.worker.ts", import.meta.url), {
    type: "module",
  });
}

export async function extractEntropyFromDataUri(
  request: EntropyWorkerRequest,
  worker?: Worker,
) {
  const normalizedRequest: EntropyWorkerRequest = {
    ...request,
    dataUri: request.dataUri.trim(),
  };

  if (!normalizedRequest.dataUri.startsWith("data:")) {
    throw new Error("Entropy worker request is missing a valid data URI.");
  }

  const activeWorker = worker ?? createEntropyWorker();
  const shouldTerminateWorker = worker === undefined;

  return new Promise<EntropyWorkerSuccessResponse>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<EntropyWorkerResponse>) => {
      const response = event.data;

      if (response.requestId !== normalizedRequest.requestId) {
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

    if (request.lavaBytes) {
      transferables.push(request.lavaBytes);
    }

    if (request.externalEntropyBytes) {
      transferables.push(request.externalEntropyBytes);
    }

    activeWorker.addEventListener("message", handleMessage);
    activeWorker.addEventListener("error", handleError);
    activeWorker.postMessage(normalizedRequest, transferables);
  });
}
