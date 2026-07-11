export default function AnimatedGridBackground() {
  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      <div className="animated-grid absolute inset-0" />
      <div className="grid-fade-mask absolute inset-0" />
      <div className="relative z-10 px-6 text-center">
        <h2 className="text-4xl font-semibold text-white sm:text-5xl">
          Built on a grid that never sits still.
        </h2>
      </div>
      <style>{`
        .animated-grid {
          background-image:
            linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: grid-drift 12s linear infinite;
        }
        .grid-fade-mask {
          background: radial-gradient(ellipse at center, transparent 0%, #020617 75%);
        }
        @keyframes grid-drift {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 48px 48px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animated-grid {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
