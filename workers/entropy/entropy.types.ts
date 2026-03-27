export type EntropyResizeConfig = {
  maxWidth?: number;
  maxHeight?: number;
  smoothingQuality?: ImageSmoothingQuality;
};

export type EntropyTimingStats = {
  createPreviewBlobMs: number;
  captureBitmapMs: number;
  resizeImageMs: number;
  extractRgbaMs: number;
  hashPoolMs: number;
  totalMs: number;
};

export type EntropyWorkerRequest = {
  type: "extract-entropy";
  requestId: string;
  sourceBitmap: ImageBitmap;
  resize?: EntropyResizeConfig;
  externalEntropyBytes?: ArrayBuffer;
};

export type EntropyWorkerSuccessResponse = {
  type: "entropy-result";
  requestId: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  channels: 4;
  rgbaBytes: ArrayBuffer;
  timingNoiseBytes: ArrayBuffer;
  entropyPoolBytes: ArrayBuffer;
  sha256Bytes: ArrayBuffer;
  sha256Hex: string;
  whiteningStrategy: "sha-256";
  supplementalEntropyOnly: true;
  timingsMs: EntropyTimingStats;
};

export type EntropyWorkerErrorResponse = {
  type: "entropy-error";
  requestId: string;
  error: string;
};

export type EntropyWorkerResponse =
  | EntropyWorkerSuccessResponse
  | EntropyWorkerErrorResponse;
