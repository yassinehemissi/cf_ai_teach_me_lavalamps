import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#302522,_#130f0e_52%,_#090708)] text-stone-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:px-10">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs uppercase tracking-[0.38em] text-stone-400">
            Agentic Lava Lamp Simulation
          </p>
          <h1 className="max-w-4xl font-mono text-4xl leading-tight text-stone-100 lg:text-6xl">
            Fluid motion, room-scale lamp walls, and an AI control layer in one
            simulation.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-300 lg:text-lg">
            This project explores a simplified lava-lamp physics model,
            large-scale multi-lamp scene composition, and an agentic control
            surface that can steer the simulation without changing its core
            structure.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/simulation"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 font-medium text-stone-950 transition hover:bg-amber-400"
          >
            Open Simulation
          </Link>
          <div className="inline-flex items-center rounded-full border border-stone-700/80 bg-stone-900/30 px-5 py-3 text-sm text-stone-300">
            Next step: room scene, lamp wall, and agent controls.
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-stone-800/80 bg-stone-950/30 p-6">
            <h2 className="font-mono text-lg text-stone-100">Physics Core</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Blob-driven scalar field simulation with bounded buoyancy,
              drag, temperature evolution, and Marching Cubes extraction.
            </p>
          </article>
          <article className="rounded-3xl border border-stone-800/80 bg-stone-950/30 p-6">
            <h2 className="font-mono text-lg text-stone-100">Scene Layer</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Room-scale composition with reusable lamp instances, shared
              lighting, and camera framing designed for spatial inspection.
            </p>
          </article>
          <article className="rounded-3xl border border-stone-800/80 bg-stone-950/30 p-6">
            <h2 className="font-mono text-lg text-stone-100">Agent Layer</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              A future tool-wrapped control surface will let an agent steer
              lamps and answer questions without bypassing guardrails.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
