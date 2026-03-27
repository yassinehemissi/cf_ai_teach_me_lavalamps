import type {
  EntropyResizeConfig,
  EntropyTimingStats,
  EntropyWorkerRequest,
  EntropyWorkerResponse,
  EntropyWorkerSuccessResponse,
} from "./entropy.types";

const DEFAULT_MAX_WIDTH = 128;
const DEFAULT_MAX_HEIGHT = 128;

const workerScope = self as typeof globalThis & {
  postMessage: (message: EntropyWorkerResponse, transfer?: Transferable[]) => void;
};

workerScope.addEventListener(
  "message",
  async (event: MessageEvent<EntropyWorkerRequest>) => {
    const request = event.data;

    if (request.type !== "extract-entropy") {
      return;
    }

    try {
      const response = await extractEntropyFromImage(request);

      workerScope.postMessage(response, [
        response.rgbaBytes,
        response.timingNoiseBytes,
        response.entropyPoolBytes,
        response.sha256Bytes,
      ]);
    } catch (error) {
      const response: EntropyWorkerResponse = {
        type: "entropy-error",
        requestId: request.requestId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown entropy worker error.",
      };

      workerScope.postMessage(response);
    }
  },
);

async function extractEntropyFromImage(
  request: EntropyWorkerRequest,
): Promise<EntropyWorkerSuccessResponse> {
  const startTime = performance.now();
  const sourceBitmap = request.sourceBitmap;
  const createPreviewBlobMs = 0;
  const captureBitmapMs = 0;
  const sourceWidth = sourceBitmap.width;
  const sourceHeight = sourceBitmap.height;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    sourceBitmap.close();
    throw new Error("The captured screenshot decoded to a zero-sized bitmap.");
  }

  const targetSize = resolveTargetSize(
    sourceWidth,
    sourceHeight,
    request.resize,
  );

  const resizeStart = performance.now();
  const canvas = new OffscreenCanvas(targetSize.width, targetSize.height);
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("Failed to create a 2D context for entropy extraction.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = request.resize?.smoothingQuality ?? "high";
  context.drawImage(sourceBitmap, 0, 0, targetSize.width, targetSize.height);
  const resizeImageMs = performance.now() - resizeStart;

  const extractStart = performance.now();
  const imageData = context.getImageData(0, 0, targetSize.width, targetSize.height);
  const rgbaBytes = new Uint8Array(imageData.data);
  const extractRgbaMs = performance.now() - extractStart;

  sourceBitmap.close();

  const timingNoiseBytes = buildTimingNoiseBytes([
    createPreviewBlobMs,
    captureBitmapMs,
    resizeImageMs,
    extractRgbaMs,
    performance.now() - startTime,
    performance.timeOrigin,
  ]);

  const entropyPoolBytes = concatUint8Arrays([
    rgbaBytes,
    toUint8Array(request.externalEntropyBytes),
    timingNoiseBytes,
  ]);

  const hashStart = performance.now();
  const sha256Buffer = await crypto.subtle.digest("SHA-256", entropyPoolBytes);
  const hashPoolMs = performance.now() - hashStart;

  const totalMs = performance.now() - startTime;
  const timingsMs: EntropyTimingStats = {
    createPreviewBlobMs,
    captureBitmapMs,
    resizeImageMs,
    extractRgbaMs,
    hashPoolMs,
    totalMs,
  };

  return {
    type: "entropy-result",
    requestId: request.requestId,
    sourceWidth,
    sourceHeight,
    width: targetSize.width,
    height: targetSize.height,
    channels: 4,
    rgbaBytes: rgbaBytes.buffer,
    timingNoiseBytes: timingNoiseBytes.buffer,
    entropyPoolBytes: entropyPoolBytes.buffer,
    sha256Bytes: sha256Buffer,
    sha256Hex: toHex(new Uint8Array(sha256Buffer)),
    whiteningStrategy: "sha-256",
    supplementalEntropyOnly: true,
    timingsMs,
  };
}

function resolveTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  resize?: EntropyResizeConfig,
) {
  const maxWidth = Math.max(1, Math.floor(resize?.maxWidth ?? DEFAULT_MAX_WIDTH));
  const maxHeight = Math.max(1, Math.floor(resize?.maxHeight ?? DEFAULT_MAX_HEIGHT));
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

function buildTimingNoiseBytes(samples: number[]) {
  const timingBuffer = new ArrayBuffer(samples.length * Float64Array.BYTES_PER_ELEMENT);
  const view = new DataView(timingBuffer);

  samples.forEach((sample, index) => {
    view.setFloat64(index * Float64Array.BYTES_PER_ELEMENT, sample, true);
  });

  return new Uint8Array(timingBuffer);
}

function toUint8Array(buffer?: ArrayBuffer) {
  return buffer ? new Uint8Array(buffer) : new Uint8Array();
}

function concatUint8Arrays(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((length, chunk) => length + chunk.byteLength, 0);
  const output = new Uint8Array(totalLength);

  let offset = 0;

  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return output;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
