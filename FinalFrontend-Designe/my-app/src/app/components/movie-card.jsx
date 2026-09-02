import { Button } from "@/components/base/buttons/button";

export default function MovieCard({ movie, onSelect }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/6 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/9">
      <div className="relative aspect-3/4 overflow-hidden bg-[#121a30]">
        <img src={movie.imageUrl} alt={`${movie.title} poster`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-[#070c1b] via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-semibold text-white">
          <span className="rounded-full bg-black/50 px-2 py-1 backdrop-blur">{movie.year}</span>
          <span className="text-amber-300">★ {movie.rating}</span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-serif text-xl text-white">{movie.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/50">{movie.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {movie.tags.map((tag) => <span key={tag} className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-2.5 py-1 text-xs text-indigo-100/80">{tag}</span>)}
        </div>
        <Button color="secondary" size="sm" className="w-full border border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white" onPress={() => onSelect(movie)}>
          View movie
        </Button>
      </div>
    </article>
  );
}