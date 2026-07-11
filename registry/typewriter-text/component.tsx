export default function TypewriterText() {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-24 text-white">
      <h2 className="typewriter-line font-mono text-3xl font-semibold sm:text-5xl">
        Ship it before your coffee gets cold.
      </h2>
      <style>{`
        .typewriter-line {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 3px solid #38bdf8;
          width: 0;
          animation:
            typewriter-type 3s steps(38, end) forwards,
            typewriter-caret 0.8s step-end infinite;
        }
        @keyframes typewriter-type {
          from {
            width: 0;
          }
          to {
            width: 38ch;
          }
        }
        @keyframes typewriter-caret {
          from,
          to {
            border-color: transparent;
          }
          50% {
            border-color: #38bdf8;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .typewriter-line {
            width: 38ch;
            animation: none;
            border-right-color: transparent;
          }
        }
      `}</style>
    </section>
  );
}
