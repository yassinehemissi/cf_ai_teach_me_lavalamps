"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import type { EntropyCaptureAction } from "../../SimulationEntropy.types";
import {
  buildDemoExternalEntropyBytes,
  concatArrayBuffers,
  hashArrayBuffer,
  waitForNextFrame,
} from "../../utils/entropy";
import { extractSceneEntropy } from "../../utils/screenshot";
import type { SimulationEntropyBridgeProps } from "./SimulationEntropyBridge.types";

export function SimulationEntropyBridge({
  onCaptureActionReady,
}: SimulationEntropyBridgeProps) {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const captureSimulationEntropy: EntropyCaptureAction = async (frameCount) => {
      const frameResults = [];

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        if (frameIndex > 0) {
          await waitForNextFrame();
        }

        const externalEntropyBytes = await buildDemoExternalEntropyBytes(frameIndex);
        const externalEntropyBytesLength = externalEntropyBytes.byteLength;
        const { result, screenshotByteLength, screenshotUrl } = await extractSceneEntropy(
          gl,
          scene,
          camera,
          {
            externalEntropyBytes,
            resize: {
              maxHeight: 128,
              maxWidth: 128,
              smoothingQuality: "high",
            },
          },
        );

        frameResults.push({
          externalEntropyBytesLength,
          frameIndex,
          screenshotByteLength,
          screenshotUrl,
          workerResult: result,
        });
      }

      const finalPoolBytes = concatArrayBuffers(
        frameResults.map((frame) => frame.workerResult.entropyPoolBytes),
      );
      const finalDigest = await hashArrayBuffer(finalPoolBytes.buffer);
      const totalExternalEntropyBytesLength = frameResults.reduce(
        (length, frame) => length + frame.externalEntropyBytesLength,
        0,
      );

      return {
        finalDigestByteLength: finalDigest.byteLength,
        finalDigestHex: finalDigest.hex,
        finalPoolByteLength: finalPoolBytes.byteLength,
        frameCount,
        frames: frameResults,
        totalExternalEntropyBytesLength,
      };
    };

    onCaptureActionReady(captureSimulationEntropy);

    return () => {
      onCaptureActionReady(null);
    };
  }, [camera, gl, onCaptureActionReady, scene]);

  return null;
}
