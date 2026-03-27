"use client";

import { Canvas } from "@react-three/fiber";

import { AllLamps } from "@/components/organisms/AllLamps/AllLamps";
import { EntropyModal } from "@/components/organisms/EntropyModal/EntropyModal";
import { Room } from "@/components/organisms/Room/Room";
import { ChatWindow } from "@/ai/client/components/ChatWindow/ChatWindow";

import { LockedCamera } from "./components/LockedCamera/LockedCamera";
import { SimulationParameterPanel } from "./components/SimulationParameterPanel/SimulationParameterPanel";
import { SimulationEntropyBridge } from "./components/SimulationEntropyBridge/SimulationEntropyBridge";
import { useSimulationParameterState } from "./SimulationParameters.state";
import { useSimulationEntropyState } from "./SimulationEntropy.state";
import { useSimulationState } from "./Simulation.state";
import { buildChatEntropyContext } from "./utils/entropyContext";

export function Simulation() {
  const { room, allLamps, camera } = useSimulationState();
  const entropy = useSimulationEntropyState();
  const simulationParameters = useSimulationParameterState(
    allLamps.lamps.map((lamp) => lamp.renderer),
  );

  const runEntropyFromChat = async (frameCount: number) => {
    const summary = await entropy.runEntropyCaptureForFrameCount(frameCount);

    if (!summary) {
      return null;
    }

    return [
      `Entropy run completed for ${summary.aggregate.frameCount} frame(s).`,
      `Final pool bytes: ${summary.aggregate.finalPoolByteLength}.`,
      `Final SHA-256: ${summary.aggregate.finalDigestHex}.`,
    ].join(" ");
  };

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
              <div className="mt-4">
                <SimulationParameterPanel
                  parameters={simulationParameters.parameterEntries}
                />
              </div>
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
          <ChatWindow
            getEntropyContext={() => buildChatEntropyContext(entropy.summary)}
            onEntropyCommand={runEntropyFromChat}
            onSimulationCommand={simulationParameters.applySimulationCommand}
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

              <Room roomScene={room.roomScene} roomScale={room.roomScale} />
              <AllLamps
                preparedModel={allLamps.preparedModel}
                lamps={allLamps.lamps}
                boards={allLamps.boards}
              />
            </Canvas>
          </div>
    </main>
  );
}
