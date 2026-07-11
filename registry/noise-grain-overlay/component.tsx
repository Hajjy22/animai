const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default function NoiseGrainOverlay() {
  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      <div className="grain-overlay pointer-events-none absolute inset-0" />
      <div className="relative z-10 px-6 text-center">
        <h2 className="text-4xl font-semibold text-white sm:text-5xl">A little grain adds a lot of depth.</h2>
        <p className="mt-4 text-slate-400">Layer this over any flat section background.</p>
      </div>
      <style>{`
        .grain-overlay {
          background-image: url("${GRAIN_SVG}");
          background-repeat: repeat;
          opacity: 0.06;
          mix-blend-mode: overlay;
          animation: grain-flicker 0.6s steps(4) infinite;
        }
        @keyframes grain-flicker {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-2%, 2%);
          }
          50% {
            transform: translate(2%, -1%);
          }
          75% {
            transform: translate(-1%, -2%);
          }
          100% {
            transform: translate(0, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .grain-overlay {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
