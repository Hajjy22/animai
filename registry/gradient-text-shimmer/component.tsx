export default function GradientTextShimmer() {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-24 text-white">
      <h2 className="shimmer-text text-4xl font-bold sm:text-6xl">Built different. Shipped faster.</h2>
      <style>{`
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #38bdf8 0%,
            #e2e8f0 20%,
            #38bdf8 40%,
            #7c3aed 60%,
            #38bdf8 80%,
            #e2e8f0 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          animation: shimmer-sweep 4s linear infinite;
        }
        @keyframes shimmer-sweep {
          to {
            background-position: -200% center;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .shimmer-text {
            animation: none;
            background-position: 0 center;
          }
        }
      `}</style>
    </section>
  );
}
