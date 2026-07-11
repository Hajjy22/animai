type Testimonial = { quote: string; name: string; role: string };

const TESTIMONIALS: Testimonial[] = [
  { quote: "Installed a hero in one command. No leaks, no drama.", name: "Priya N.", role: "Frontend lead" },
  { quote: "Our agent ships 3D sections now without babysitting Three.js.", name: "Marco D.", role: "Founder" },
  { quote: "The vetting report is the first thing I check before merging.", name: "Alex T.", role: "Staff engineer" },
  { quote: "Finally, motion components that don't crash on the server.", name: "Sam R.", role: "Indie hacker" },
];

export default function TestimonialMarqueeCards() {
  return (
    <section className="testimonial-marquee relative w-full overflow-hidden bg-slate-950 py-16">
      <div className="marquee-track flex w-max gap-6">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-6" aria-hidden={copy === 1}>
            {TESTIMONIALS.map((item, index) => (
              <figure
                key={`${copy}-${index}`}
                className="w-80 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <blockquote className="text-slate-200">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm text-slate-400">
                  <span className="font-semibold text-white">{item.name}</span> — {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        .marquee-track {
          animation: testimonial-scroll 26s linear infinite;
        }
        .testimonial-marquee:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes testimonial-scroll {
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
