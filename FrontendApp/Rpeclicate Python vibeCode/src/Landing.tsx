import { useNavigate } from "react-router";
import { useState, useEffect } from "react";

const FEATURE_CARDS = [
  {
    icon: "✦",
    title: "Smart Recommendations",
    desc: "K-nearest neighbour engine surfaces films tuned to your taste — not just what's trending.",
  },
  {
    icon: "◈",
    title: "Movie Room",
    desc: "Deep-dive into any film: cast, runtime, genre, similar picks, and a curated Top 5.",
  },
  {
    icon: "◉",
    title: "Save & Favourite",
    desc: "Build your personal library. Mark films to watch later or lock in your all-time favourites.",
  },
];

const FLOATING_GENRES = ["Sci-Fi", "Drama", "Thriller", "Romance", "Crime", "Action", "Comedy", "Horror"];

const PREVIEW_POSTERS = [
  "https://images.unsplash.com/photo-1572188863110-46d457c9234d?w=300&h=420&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=300&h=420&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&h=420&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300&h=420&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=420&fit=crop&auto=format",
];

export default function Landing() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
    <div
      className="min-h-full w-full flex flex-col overflow-x-hidden relative"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, #0d1b3e 0%, #050a14 55%, #0a0510 100%)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: "absolute", top: "5%", left: "5%",
            width: 600, height: 600,
            background: "radial-gradient(circle, #1e3a8a18 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: "10%", right: "5%",
            width: 500, height: 500,
            background: "radial-gradient(circle, #7c3aed12 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          style={{
            position: "absolute", top: "45%", left: "45%",
            width: 400, height: 400,
            background: "radial-gradient(circle, #0f766e10 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Nav */}
      <nav
        className="relative z-20 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            🎬
          </div>
          <span
            className="text-white font-semibold tracking-tight text-base"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            CineMatch
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/30 text-sm">Movie Recommendation Engine</span>
          <button
            onClick={() => navigate("/app")}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            }}
          >
            Open App →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16 gap-6">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/50 tracking-widest uppercase"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: "0 0 6px #34d39988" }} />
          Powered by K-NN Recommendation
        </div>

        <h1
          className="text-white max-w-2xl leading-tight"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            lineHeight: 1.1,
          }}
        >
          Find your next
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #93c5fd 0%, #a78bfa 50%, #f0abfc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            favourite film
          </span>
        </h1>

        <p className="text-white/40 max-w-md text-base leading-relaxed">
          A minimal recommendation engine that learns what you love and surfaces the five films
          most likely to move you — no noise, just signal.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => navigate("/app")}
            className="relative px-7 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.6) 100%)",
              border: "1px solid rgba(139,92,246,0.4)",
              backdropFilter: "blur(12px)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(139,92,246,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Recommend me a movie
          </button>
          <button
            className="px-5 py-3.5 rounded-2xl text-sm font-medium text-white/50 transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
            }}
          >
            Learn more ↓
          </button>
        </div>

        {/* Floating genre chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-sm">
          {FLOATING_GENRES.map((g, i) => (
            <span
              key={g}
              className="text-xs px-3 py-1 rounded-full transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: tick % FLOATING_GENRES.length === i ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                transform: tick % FLOATING_GENRES.length === i ? "scale(1.08)" : "scale(1)",
                transition: "all 0.5s ease",
              }}
            >
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* Poster strip */}
      <section className="relative z-10 px-8 pb-16">
        <div className="flex gap-4 justify-center items-end">
          {PREVIEW_POSTERS.map((src, i) => {
            const offsets = [-12, -6, 0, -6, -12];
            const scales = [0.88, 0.94, 1, 0.94, 0.88];
            const isHov = hovered === i;
            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 relative"
                style={{
                  width: 120,
                  height: isHov ? 210 : 180,
                  transform: `translateY(${isHov ? -10 : offsets[i]}px) scale(${isHov ? 1.04 : scales[i]})`,
                  border: isHov ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isHov ? "0 20px 60px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.3)",
                  opacity: isHov ? 1 : 0.7,
                  zIndex: isHov ? 10 : 1,
                  flexShrink: 0,
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <img src={src} alt="Movie poster" className="w-full h-full object-cover" />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-8 pb-20 max-w-4xl mx-auto w-full">
        <p className="text-center text-white/25 text-xs tracking-widest uppercase mb-8">What's inside</p>
        <div className="grid grid-cols-3 gap-4">
          {FEATURE_CARDS.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 p-5 rounded-2xl transition-all group cursor-default"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(16px)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.07)";
              }}
            >
              <span className="text-2xl text-white/60">{f.icon}</span>
              <h3 className="text-white text-sm font-semibold">{f.title}</h3>
              <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="relative z-10 px-8 pb-16">
        <div
          className="max-w-4xl mx-auto flex items-center justify-between gap-6 px-8 py-6 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div>
            <h3
              className="text-white text-lg font-semibold"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Ready to discover something new?
            </h3>
            <p className="text-white/35 text-sm mt-1">
              Open the Movie Room and let the engine do the work.
            </p>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="shrink-0 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.6) 100%)",
              border: "1px solid rgba(139,92,246,0.35)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(139,92,246,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Enter Movie Room →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 pb-8 flex justify-center">
        <p className="text-white/15 text-xs">CineMatch · Minimal Movie Recommendation</p>
      </footer>
    </div>
    </>
  );
}
