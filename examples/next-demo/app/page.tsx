export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <p className="mb-3 text-sm uppercase tracking-wide text-cyan-300">
          AnimAI target app
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold">
          A plain hero before the motion layer is injected.
        </h1>
        <p className="mt-5 max-w-2xl text-zinc-300">
          Run the demo command from the repository root to let AnimAI add a
          curated React Three Fiber component and patch this route.
        </p>
      </section>
    </main>
  );
}
