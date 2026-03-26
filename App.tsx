"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import { OneLamp } from "@/components/organisms/OneLamp/OneLamp";

export default function App() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#2f221f,_#120d0c_55%,_#080607)] text-stone-100">
      <section className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Axis Projection Test
          </p>
          <h1 className="font-mono text-2xl text-stone-100">
            One Lamp Sandbox
          </h1>
        </div>
        <p className="max-w-sm text-right text-sm text-stone-300">
          Physics stays in core. This scene only experiments with renderer-side
          projection and lamp-fit visualization.
        </p>
      </section>
      <div className="h-screen">
        <Canvas camera={{ fov: 86, position: [0, 1.6, 7.5] }}>
          <color attach="background" args={["#080607"]} />
          <fog attach="fog" args={["#080607", 7, 14]} />
          <ambientLight intensity={0.45} />
          <directionalLight
            position={[4, 6, 4]}
            intensity={1.4}
            color="#ffd7b0"
          />
          <pointLight position={[0, -1.5, 2]} intensity={18} color="#ff7a1c" />
          <directionalLight position={[0, -1.5, 2]} intensity={5} castShadow />
          <Suspense fallback={null}>
            <OneLamp />
          </Suspense>
        </Canvas>
      </div>
    </main>
  );
}
