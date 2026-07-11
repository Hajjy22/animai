const ITEMS = ["Vetted", "Leak-free", "SSR-safe", "AST-injected", "CLI & MCP ready"];

export default function MarqueeTextLoop() {
  return (
    <section className="marquee-loop relative w-full overflow-hidden bg-slate-950 py-10 text-white">
      <div className="marquee-track flex w-max gap-12">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-12" aria-hidden={copy === 1}>
            {ITEMS.map((item, index) => (
              <span
                key={`${copy}-${index}`}
                className="flex items-center gap-3 whitespace-nowrap text-2xl font-semibold text-slate-300"
              >
                {item}
                <span className="text-sky-400">&#9670;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        .marquee-track {
          animation: marquee-scroll 18s linear infinite;
        }
        .marquee-loop:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
