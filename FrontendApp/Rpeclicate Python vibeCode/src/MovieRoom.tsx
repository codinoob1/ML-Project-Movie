import { useState } from "react";
import { useNavigate } from "react-router";

const MOVIES = [
  {
    id: 1,
    title: "Blade Runner 2049",
    genre: "Sci-Fi · Thriller",
    year: 2017,
    rating: 8.0,
    runtime: "2h 44m",
    desc: "A young blade runner discovers a long-buried secret that leads him to track down former blade runner Rick Deckard, who's been missing for thirty years.",
    poster: "https://images.unsplash.com/photo-1572188863110-46d457c9234d?w=400&h=600&fit=crop&auto=format",
    color: "#4a90d9",
  },
  {
    id: 2,
    title: "Dune: Part Two",
    genre: "Sci-Fi · Adventure",
    year: 2024,
    rating: 8.5,
    runtime: "2h 46m",
    desc: "Paul Atreides unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
    poster: "https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=400&h=600&fit=crop&auto=format",
    color: "#c9a227",
  },
  {
    id: 3,
    title: "Oppenheimer",
    genre: "Drama · History",
    year: 2023,
    rating: 8.3,
    runtime: "3h 0m",
    desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=600&fit=crop&auto=format",
    color: "#e05c2a",
  },
  {
    id: 4,
    title: "The Batman",
    genre: "Action · Crime",
    year: 2022,
    rating: 7.8,
    runtime: "2h 56m",
    desc: "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues.",
    poster: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=600&fit=crop&auto=format",
    color: "#2d4a8a",
  },
  {
    id: 5,
    title: "Past Lives",
    genre: "Romance · Drama",
    year: 2023,
    rating: 7.9,
    runtime: "1h 46m",
    desc: "Two childhood friends reunite across decades and continents, reflecting on what could have been.",
    poster: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop&auto=format",
    color: "#7a5c9e",
  },
];

const TOP5 = [
  { title: "Interstellar", genre: "Sci-Fi", rating: 8.7 },
  { title: "Inception", genre: "Action", rating: 8.8 },
  { title: "The Godfather", genre: "Crime", rating: 9.2 },
  { title: "Parasite", genre: "Thriller", rating: 8.5 },
  { title: "Everything Everywhere", genre: "Comedy", rating: 7.8 },
];

const SIMILAR = [
  { title: "Arrival", poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=120&h=170&fit=crop&auto=format" },
  { title: "Ex Machina", poster: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=120&h=170&fit=crop&auto=format" },
  { title: "Moon", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=170&fit=crop&auto=format" },
  { title: "Annihilation", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&h=170&fit=crop&auto=format" },
];

type View = "home" | "saved";

export default function MovieRoom() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<View>("home");
  const [selectedMovie, setSelectedMovie] = useState(MOVIES[0]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleSaved = (id: number) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleFav = (id: number) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const filtered = search
    ? MOVIES.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.genre.toLowerCase().includes(search.toLowerCase())
      )
    : MOVIES;

  const savedMovies = MOVIES.filter((m) => saved.includes(m.id));

  return (
    <div
      className="flex h-full w-full overflow-hidden relative"
      style={{
        background: "radial-gradient(ellipse at 20% 50%, #0d1b3e 0%, #050a14 60%, #0a0510 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%", left: "15%", width: 400, height: 400,
          background: `radial-gradient(circle, ${selectedMovie.color}22 0%, transparent 70%)`,
          filter: "blur(60px)", transition: "background 0.8s ease",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "5%", right: "10%", width: 300, height: 300,
          background: "radial-gradient(circle, #7c3aed18 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Sidebar */}
      <aside
        className="relative z-10 flex flex-col py-8 px-4 gap-2 shrink-0"
        style={{
          width: 72,
          background: "rgba(255,255,255,0.04)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Back to landing */}
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={() => navigate("/")}
            title="Back to home"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        </div>

        <NavIcon
          active={activeView === "home"}
          onClick={() => setActiveView("home")}
          label="Home"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
        <NavIcon
          active={activeView === "saved"}
          onClick={() => setActiveView("saved")}
          label="Saved"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          }
        />

        <div className="mt-auto">
          <NavIcon
            active={false}
            onClick={() => {}}
            label="Profile"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {activeView === "home" ? (
          <div className="flex flex-1 overflow-hidden gap-0">
            {/* Movie Room */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs tracking-widest uppercase font-medium">Movie Room</p>
                  <h1
                    className="text-white text-xl font-semibold mt-0.5"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    Your Recommendations
                  </h1>
                </div>

                {/* Search */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    width: 260,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Recommend me a movie..."
                    className="bg-transparent text-white/80 text-sm outline-none placeholder:text-white/25 w-full"
                  />
                </div>
              </div>

              {/* Selected Movie Detail */}
              <GlassPanel className="flex gap-5 p-5">
                {/* Poster */}
                <div
                  className="rounded-xl overflow-hidden shrink-0 relative"
                  style={{ width: 140, height: 200 }}
                >
                  <img
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover"
                    style={{ transition: "opacity 0.4s" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}
                  />
                  <div
                    className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "white" }}
                  >
                    {selectedMovie.rating}★
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2
                          className="text-white text-xl font-semibold leading-tight"
                          style={{ fontFamily: "'DM Serif Display', serif" }}
                        >
                          {selectedMovie.title}
                        </h2>
                        <p className="text-white/40 text-xs mt-1">
                          {selectedMovie.genre} · {selectedMovie.year} · {selectedMovie.runtime}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <IconBtn
                          active={favorites.includes(selectedMovie.id)}
                          onClick={() => toggleFav(selectedMovie.id)}
                          label="Favourite"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={favorites.includes(selectedMovie.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                        </IconBtn>
                        <IconBtn
                          active={saved.includes(selectedMovie.id)}
                          onClick={() => toggleSaved(selectedMovie.id)}
                          label="Save"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={saved.includes(selectedMovie.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                        </IconBtn>
                      </div>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed mt-3 line-clamp-3">
                      {selectedMovie.desc}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-white/30 text-xs tracking-widest uppercase mb-2">Similar</p>
                    <div className="flex gap-2">
                      {SIMILAR.map((s) => (
                        <div
                          key={s.title}
                          className="rounded-lg overflow-hidden relative cursor-pointer group"
                          style={{ width: 54, height: 76, border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <img src={s.poster} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1"
                            style={{ background: "rgba(0,0,0,0.55)" }}
                          >
                            <span className="text-white text-[8px] leading-tight">{s.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Recommended Cards k=5 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/40 text-xs tracking-widest uppercase font-medium">Recommended · k=5</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Based on {selectedMovie.title}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {filtered.map((movie) => (
                    <DefaultCard
                      key={movie.id}
                      movie={movie}
                      selected={selectedMovie.id === movie.id}
                      isSaved={saved.includes(movie.id)}
                      isFav={favorites.includes(movie.id)}
                      onSelect={() => setSelectedMovie(movie)}
                      onSave={() => toggleSaved(movie.id)}
                      onFav={() => toggleFav(movie.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel — Top 5 */}
            <aside
              className="flex flex-col p-5 gap-4 shrink-0 overflow-y-auto"
              style={{
                width: 220,
                background: "rgba(255,255,255,0.03)",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
              }}
            >
              <p className="text-white/40 text-xs tracking-widest uppercase font-medium mt-2">Top 5</p>
              <div className="flex flex-col gap-2">
                {TOP5.map((m, i) => (
                  <div
                    key={m.title}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    }}
                  >
                    <span
                      className="text-xs font-bold shrink-0 w-5 text-center"
                      style={{ color: i === 0 ? "#f4c430" : "rgba(255,255,255,0.25)" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{m.title}</p>
                      <p className="text-white/30 text-[10px] truncate">{m.genre}</p>
                    </div>
                    <span className="text-white/40 text-[10px] shrink-0">{m.rating}</span>
                  </div>
                ))}
              </div>

              <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />

              <p className="text-white/40 text-xs tracking-widest uppercase font-medium">Quick Pick</p>
              {MOVIES.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMovie(m)}
                  className="text-left rounded-xl overflow-hidden relative h-20 w-full group"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <img src={m.poster} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />
                  <p className="absolute bottom-2 left-2 text-white text-[10px] font-medium">{m.title}</p>
                </button>
              ))}
            </aside>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <p className="text-white/40 text-xs tracking-widest uppercase font-medium">Library</p>
              <h1 className="text-white text-xl font-semibold mt-0.5" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Saved Movies
              </h1>
            </div>
            {savedMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  🎬
                </div>
                <p className="text-white/30 text-sm">No saved movies yet</p>
                <p className="text-white/20 text-xs">Bookmark movies from the home view</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {savedMovies.map((movie) => (
                  <DefaultCard
                    key={movie.id}
                    movie={movie}
                    selected={false}
                    isSaved={true}
                    isFav={favorites.includes(movie.id)}
                    onSelect={() => { setSelectedMovie(movie); setActiveView("home"); }}
                    onSave={() => toggleSaved(movie.id)}
                    onFav={() => toggleFav(movie.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        borderRadius: 16,
      }}
    >
      {children}
    </div>
  );
}

function NavIcon({ icon, active, onClick, label }: {
  icon: React.ReactNode; active: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-full flex items-center justify-center rounded-xl p-3 transition-all"
      style={{
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
        color: active ? "white" : "rgba(255,255,255,0.35)",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
    >
      {icon}
    </button>
  );
}

function IconBtn({ children, active, onClick, label }: {
  children: React.ReactNode; active: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
      style={{
        background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: active ? "white" : "rgba(255,255,255,0.4)",
      }}
    >
      {children}
    </button>
  );
}

function DefaultCard({ movie, selected, isSaved, isFav, onSelect, onSave, onFav }: {
  movie: (typeof MOVIES)[0];
  selected: boolean; isSaved: boolean; isFav: boolean;
  onSelect: () => void; onSave: () => void; onFav: () => void;
}) {
  return (
    <div
      className="relative flex flex-col rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: selected ? `1px solid ${movie.color}55` : "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        boxShadow: selected ? `0 0 20px ${movie.color}22` : "none",
        transform: selected ? "translateY(-2px)" : "none",
        transition: "all 0.25s ease",
      }}
      onClick={onSelect}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }}
        />
        <div
          className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onFav}
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: isFav ? "#ff6b81" : "rgba(255,255,255,0.6)" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
          <button
            onClick={onSave}
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: isSaved ? "#60a5fa" : "rgba(255,255,255,0.6)" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-[10px] font-semibold leading-tight line-clamp-2">{movie.title}</p>
          <p className="text-white/40 text-[9px] mt-0.5">{movie.year}</p>
        </div>
      </div>
      <div className="px-2 py-1.5">
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: `${movie.color}22`, color: `${movie.color}cc`, border: `1px solid ${movie.color}33` }}
        >
          {movie.genre.split(" · ")[0]}
        </span>
      </div>
    </div>
  );
}
