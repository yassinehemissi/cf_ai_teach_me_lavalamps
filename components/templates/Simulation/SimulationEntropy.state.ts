"use client";

import { useCallback, useRef, useState } from "react";

import type {
  EntropyCaptureAction,
  EntropyCaptureActionResult,
  EntropyFrameActionResult,
  EntropyModalSummary,
  SimulationEntropyState,
} from "./SimulationEntropy.types";

const DEFAULT_FRAME_COUNT = 1;
const MAX_FRAME_COUNT = 12;
const MIN_FRAME_COUNT = 1;

export function useSimulationEntropyState() {
  const captureActionRef = useRef<EntropyCaptureAction | null>(null);
  const [state, setState] = useState<SimulationEntropyState>({
    error: null,
    frameCount: DEFAULT_FRAME_COUNT,
    isCaptureReady: false,
    isModalOpen: false,
    phase: "idle",
    summary: null,
  });

  const registerCaptureAction = useCallback(
    (action: EntropyCaptureAction | null) => {
      captureActionRef.current = action;
      setState((currentState) => ({
        ...currentState,
        isCaptureReady: action !== null,
      }));
    },
    [],
  );

  const setFrameCount = useCallback((frameCount: number) => {
    setState((currentState) => ({
      ...currentState,
      frameCount: clampFrameCount(frameCount),
    }));
  }, []);

  const closeModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      error: null,
      isModalOpen: false,
    }));
  }, []);

  const executeEntropyCapture = useCallback(async (requestedFrameCount: number) => {
    const captureAction = captureActionRef.current;

    if (!captureAction) {
      setState((currentState) => ({
        ...currentState,
        error: "Entropy capture is not ready yet.",
        isModalOpen: true,
        phase: "error",
      }));
      return null;
    }

    setState((currentState) => ({
      ...currentState,
      error: null,
      isModalOpen: true,
      phase: "capturing",
      summary: null,
    }));

    try {
      const activeFrameCount = clampFrameCount(requestedFrameCount);
      const actionPromise = captureAction(activeFrameCount);

      setState((currentState) => ({
        ...currentState,
        phase: "processing",
      }));

      const captureResult = await actionPromise;
      const summary = buildEntropySummary(captureResult);

      setState((currentState) => ({
        ...currentState,
        phase: "success",
        summary,
      }));

      return summary;
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        error:
          error instanceof Error ? error.message : "Entropy capture failed.",
        phase: "error",
      }));

      return null;
    }
  }, []);

  const runEntropyCapture = useCallback(() => {
    return executeEntropyCapture(state.frameCount);
  }, [executeEntropyCapture, state.frameCount]);

  const runEntropyCaptureForFrameCount = useCallback((frameCount: number) => {
    return executeEntropyCapture(frameCount);
  }, [executeEntropyCapture]);

  return {
    ...state,
    closeModal,
    registerCaptureAction,
    runEntropyCapture,
    runEntropyCaptureForFrameCount,
    setFrameCount,
  };
}

function buildEntropySummary({
  finalDigestByteLength,
  finalDigestHex,
  finalPoolByteLength,
  frameCount,
  frames,
  totalExternalEntropyBytesLength,
  totalLavaBytesLength,
}: EntropyCaptureActionResult): EntropyModalSummary {
  return {
    aggregate: {
      finalDigestByteLength,
      finalDigestHex,
      finalPoolByteLength,
      frameCount,
      totalExternalEntropyBytesLength,
      totalLavaBytesLength,
    },
    frames: frames.map((frame) => buildFrameSummary(frame)),
  };
}

function buildFrameSummary(
  frame: EntropyFrameActionResult,
): EntropyModalSummary["frames"][number] {
  return {
    capture: {
      dataUriLength: frame.dataUriLength,
      frameIndex: frame.frameIndex,
      mimeType: "image/png",
      screenshotDataUri: frame.screenshotDataUri,
    },
    digest: {
      byteLength: frame.workerResult.sha256Bytes.byteLength,
      hex: frame.workerResult.sha256Hex,
      supplementalEntropyOnly: frame.workerResult.supplementalEntropyOnly,
      whiteningStrategy: frame.workerResult.whiteningStrategy,
    },
    externalEntropy: {
      byteLength: frame.externalEntropyBytesLength,
      previewHex: `demo-random+time bytes: ${frame.externalEntropyBytesLength}`,
    },
    pool: {
      byteLength: frame.workerResult.entropyPoolBytes.byteLength,
      lavaBytesLength: frame.lavaBytesLength,
      previewHex: createPreviewHex(frame.workerResult.entropyPoolBytes),
    },
    resize: {
      height: frame.workerResult.height,
      sourceHeight: frame.workerResult.sourceHeight,
      sourceWidth: frame.workerResult.sourceWidth,
      width: frame.workerResult.width,
    },
    rgba: {
      byteLength: frame.workerResult.rgbaBytes.byteLength,
      previewHex: createPreviewHex(frame.workerResult.rgbaBytes),
      shape: [
        frame.workerResult.height,
        frame.workerResult.width,
        frame.workerResult.channels,
      ],
    },
    timingNoise: {
      byteLength: frame.workerResult.timingNoiseBytes.byteLength,
      previewHex: createPreviewHex(frame.workerResult.timingNoiseBytes),
    },
    timingsMs: frame.workerResult.timingsMs,
  };
}

function createPreviewHex(buffer: ArrayBuffer, previewByteCount = 16) {
  const previewBytes = new Uint8Array(buffer).slice(0, previewByteCount);

  return Array.from(previewBytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join(" ");
}

function clampFrameCount(frameCount: number) {
  return Math.min(MAX_FRAME_COUNT, Math.max(MIN_FRAME_COUNT, Math.floor(frameCount)));
}
