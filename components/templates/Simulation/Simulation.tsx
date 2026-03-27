"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";

import { AllLamps } from "@/components/organisms/AllLamps/AllLamps";
import { Room } from "@/components/organisms/Room/Room";

import { useSimulationState } from "./Simulation.state";

export function Simulation() {
  const { room, allLamps, camera } = useSimulationState();

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
        <p className="max-w-lg text-right text-sm text-stone-300">
          A room-scale 4x4 lamp wall mounted on a non-door surface, powered by
          reusable lamp instances and shared scene lighting.
        </p>
      </section>
      <div className="h-screen">
        <Canvas camera={{ fov: 78, position: camera.position }}>
          <LockedCamera target={camera.target} position={camera.position} />
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
