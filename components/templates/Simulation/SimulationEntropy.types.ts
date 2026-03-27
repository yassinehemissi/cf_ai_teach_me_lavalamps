import type { EntropyWorkerSuccessResponse } from "@/workers/entropy/entropy.types";

export type EntropyCapturePhase =
  | "idle"
  | "capturing"
  | "processing"
  | "success"
  | "error";

export type EntropyFrameActionResult = {
  dataUriLength: number;
  externalEntropyBytesLength: number;
  frameIndex: number;
  lavaBytesLength: number;
  screenshotDataUri: string;
  workerResult: EntropyWorkerSuccessResponse;
};

export type EntropyCaptureActionResult = {
  finalDigestByteLength: number;
  finalDigestHex: string;
  finalPoolByteLength: number;
  frameCount: number;
  frames: EntropyFrameActionResult[];
  totalExternalEntropyBytesLength: number;
  totalLavaBytesLength: number;
};

export type EntropyCaptureAction = (
  frameCount: number,
) => Promise<EntropyCaptureActionResult>;

export type EntropyBytePreview = {
  byteLength: number;
  previewHex: string;
};

export type EntropyFrameSummary = {
  capture: {
    dataUriLength: number;
    frameIndex: number;
    mimeType: "image/png";
    screenshotDataUri: string;
  };
  digest: {
    byteLength: number;
    hex: string;
    supplementalEntropyOnly: true;
    whiteningStrategy: "sha-256";
  };
  externalEntropy: EntropyBytePreview;
  pool: EntropyBytePreview & {
    lavaBytesLength: number;
  };
  resize: {
    height: number;
    sourceHeight: number;
    sourceWidth: number;
    width: number;
  };
  rgba: EntropyBytePreview & {
    shape: [number, number, 4];
  };
  timingNoise: EntropyBytePreview;
  timingsMs: EntropyWorkerSuccessResponse["timingsMs"];
};

export type EntropyModalSummary = {
  aggregate: {
    finalDigestByteLength: number;
    finalDigestHex: string;
    finalPoolByteLength: number;
    frameCount: number;
    totalExternalEntropyBytesLength: number;
    totalLavaBytesLength: number;
  };
  frames: EntropyFrameSummary[];
};

export type SimulationEntropyState = {
  error: string | null;
  frameCount: number;
  isCaptureReady: boolean;
  isModalOpen: boolean;
  phase: EntropyCapturePhase;
  summary: EntropyModalSummary | null;
};

export type EntropyCaptureExecution = {
  runEntropyCapture: () => Promise<EntropyModalSummary | null>;
  runEntropyCaptureForFrameCount: (
    frameCount: number,
  ) => Promise<EntropyModalSummary | null>;
};
