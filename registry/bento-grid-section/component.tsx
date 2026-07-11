type BentoItem = {
  id: string;
  title: string;
  description: string;
  span: string;
};

const ITEMS: BentoItem[] = [
  { id: "vetted", title: "Vetted registry", description: "Every component passes a static safety harness before it ships.", span: "sm:col-span-2 sm:row-span-2" },
  { id: "cli", title: "CLI & MCP", description: "Install from the terminal or let your AI agent do it.", span: "sm:col-span-1" },
  { id: "ssr", title: "SSR-safe", description: "WebGL is always gated behind next/dynamic.", span: "sm:col-span-1" },
  { id: "leak-free", title: "Leak-free", description: "Dispose cleanup is enforced, not optional.", span: "sm:col-span-1" },
  { id: "ast", title: "AST-safe injection", description: "Your source is never touched by regex.", span: "sm:col-span-1" },
];

export default function BentoGridSection() {
  return (
    <section className="bento-section w-full bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto grid max-w-4xl auto-rows-[10rem] grid-cols-1 gap-4 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div
            key={item.id}
            className={`bento-card group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition ${item.span}`}
          >
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="bento-description mt-1 text-sm text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
      <style>{`
        .bento-card {
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        .bento-card:hover {
          border-color: rgba(56, 189, 248, 0.5);
          transform: translateY(-2px);
        }
        .bento-description {
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        .bento-card:hover .bento-description {
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
