import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#302522,_#130f0e_52%,_#090708)] text-stone-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:px-10">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs uppercase tracking-[0.38em] text-stone-400">
            CLOUDFLARE INSPIRED LAVAL LAMPS TO ENTROPY SIMULATION
          </p>
          <h1 className="max-w-6xl font-mono text-4xl leading-tight text-stone-100 lg:text-5xl">
            Simulating Lava Lamps for Entropy Generation
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-300 lg:text-lg">
            This project simulates lava-lamp-like real-time system where
            simulated fluid motion generates structured randomness. Each frame
            becomes entropy. Each interaction is bounded. An AI layer sits on
            top — not to generate, but to understand, explain, and steer the
            system without
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/simulation"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 font-medium text-stone-950 transition hover:bg-amber-400"
          >
            Try It Live
          </Link>
          <p className="text-center  items-center rounded-full border border-stone-700/80  bg-stone-900/30 px-5 py-3 text-sm text-stone-300">
            Protected simulation, auth-backed chat quota, please respect it.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-stone-800/80 bg-stone-950/30 p-6">
            <h2 className="font-mono text-lg text-stone-100">Physics Core</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Lava-lamp-like blob motion driven by simplified heating, cooling,
              buoyancy, drag, and scalar field evolution.
            </p>
          </article>
          <article className="rounded-3xl border border-stone-800/80 bg-stone-950/30 p-6">
            <h2 className="font-mono text-lg text-stone-100">Scene Layer</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              A room scene with a mounted lamp wall, shared lighting, fixed
              framing, and reusable renderer instances.
            </p>
          </article>
          <article className="rounded-3xl border border-stone-800/80 bg-stone-950/30 p-6">
            <h2 className="font-mono text-lg text-stone-100">
              Entropy + Agent
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Lamp frames are flattened and hashed with timing jitter for demo
              entropy, and the AI chat can explain, run, and modify bounded
              simulation behavior.
            </p>
          </article>
        </div>
        <p className="text-sm text-stone-400">
          Made with love by{" "}
          <a
            href="https://www.yassinehemissi.me/"
            target="_blank"
            rel="noreferrer"
            className="text-amber-300 transition hover:text-amber-200"
          >
            Med
          </a>
          .
        </p>
      </section>
    </main>
  );
}
