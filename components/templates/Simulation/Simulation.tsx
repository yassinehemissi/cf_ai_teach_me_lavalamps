"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";

import { AllLamps } from "@/components/organisms/AllLamps/AllLamps";
import { EntropyModal } from "@/components/organisms/EntropyModal/EntropyModal";
import { Room } from "@/components/organisms/Room/Room";

import { useSimulationEntropyState } from "./SimulationEntropy.state";
import type { EntropyCaptureAction } from "./SimulationEntropy.types";
import { useSimulationState } from "./Simulation.state";
import {
  buildDemoExternalEntropyBytes,
  concatArrayBuffers,
  hashArrayBuffer,
  waitForNextFrame,
} from "./utils/entropy";
import { extractSceneEntropy } from "./utils/screenshot";

export function Simulation() {
  const { room, allLamps, camera } = useSimulationState();
  const entropy = useSimulationEntropyState();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#2f221f,_#120d0c_55%,_#080607)] text-stone-100">
      <section className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Room Simulation
          </p>
          <h1 className="font-mono text-2xl text-stone-100">
            Lava Lamp Wall
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="max-w-lg text-right text-sm text-stone-300">
            A room-scale 4x4 lamp wall mounted on a non-door surface, powered by
            reusable lamp instances and shared scene lighting.
          </p>
          <div className="flex flex-col items-end gap-2">
            <label className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-stone-400">
              Frames
              <input
                type="number"
                min={1}
                max={12}
                value={entropy.frameCount}
                onChange={(event) => {
                  entropy.setFrameCount(Number(event.target.value));
                }}
                className="w-20 rounded-xl border border-stone-700/80 bg-stone-950/70 px-3 py-2 text-sm tracking-normal text-stone-100 outline-none transition focus:border-amber-400"
              />
            </label>
            <button
              type="button"
              onClick={entropy.runEntropyCapture}
              disabled={!entropy.isCaptureReady || entropy.phase === "capturing" || entropy.phase === "processing"}
              className="inline-flex items-center justify-center rounded-full border border-stone-700/80 bg-stone-950/60 px-4 py-2 text-sm text-stone-100 transition hover:border-amber-400 hover:text-amber-200"
            >
              Entropy
            </button>
          </div>
        </div>
      </section>
      <EntropyModal
        error={entropy.error}
        isOpen={entropy.isModalOpen}
        onClose={entropy.closeModal}
        phase={entropy.phase}
        summary={entropy.summary}
      />
      <div className="h-screen">
        <Canvas
          camera={{ fov: 78, position: camera.position }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <LockedCamera target={camera.target} position={camera.position} />
          <SimulationEntropyBridge
            onCaptureActionReady={entropy.registerCaptureAction}
          />
          <color attach="background" args={["#080607"]} />
          <ambientLight color="#f4d5b4" intensity={1.55} />

          <Suspense fallback={null}>
            <Room roomScene={room.roomScene} roomScale={room.roomScale} />
            <AllLamps
              preparedModel={allLamps.preparedModel}
              lamps={allLamps.lamps}
              boards={allLamps.boards}
            />
          </Suspense>
        </Canvas>
      </div>
    </main>
  );
}

function LockedCamera({
  target,
  position,
}: {
  target: [number, number, number];
  position: [number, number, number];
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target]);

  return null;
}

function SimulationEntropyBridge({
  onCaptureActionReady,
}: {
  onCaptureActionReady: (action: EntropyCaptureAction | null) => void;
}) {
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
        const { dataUri, result } = await extractSceneEntropy(gl, scene, camera, {
          externalEntropyBytes,
          resize: {
            maxHeight: 128,
            maxWidth: 128,
            smoothingQuality: "high",
          },
        });

        frameResults.push({
          dataUriLength: dataUri.length,
          externalEntropyBytesLength,
          frameIndex,
          lavaBytesLength: 0,
          screenshotDataUri: dataUri,
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
        totalLavaBytesLength: 0,
      };
    };

    onCaptureActionReady(captureSimulationEntropy);

    return () => {
      onCaptureActionReady(null);
    };
  }, [camera, gl, onCaptureActionReady, scene]);

  return null;
}
