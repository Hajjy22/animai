// Fixed positions/delays (not Math.random()) so server and client markup match
// exactly — this component has no "use client" gate, so it renders on the
// server by default, and randomized inline styles would cause a hydration
// mismatch there.
const METEORS = [
  { left: "4%", delay: "0s", duration: "6s" },
  { left: "14%", delay: "1.4s", duration: "5s" },
  { left: "24%", delay: "3.1s", duration: "7s" },
  { left: "35%", delay: "0.6s", duration: "5.5s" },
  { left: "47%", delay: "2.2s", duration: "6.5s" },
  { left: "58%", delay: "4s", duration: "5s" },
  { left: "68%", delay: "1.8s", duration: "7.2s" },
  { left: "77%", delay: "3.6s", duration: "6s" },
  { left: "86%", delay: "0.2s", duration: "5.8s" },
  { left: "93%", delay: "2.7s", duration: "6.8s" },
];

export default function MeteorShowerBackground() {
  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      {METEORS.map((meteor, index) => (
        <span
          key={index}
          className="meteor absolute top-[-10%] h-0.5 w-0.5 rounded-full bg-sky-200"
          style={{
            left: meteor.left,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration,
          }}
        />
      ))}
      <div className="relative z-10 px-6 text-center">
        <h2 className="text-4xl font-semibold text-white sm:text-5xl">A sky full of shipped features.</h2>
      </div>
      <style>{`
        .meteor {
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .meteor::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, rgba(226, 232, 240, 0.9), transparent);
          transform: translate(-100%, -50%) rotate(215deg);
          transform-origin: right center;
        }
        .meteor {
          animation-name: meteor-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes meteor-fall {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(-320px, 480px);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .meteor {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
