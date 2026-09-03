
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import Navbar from "../components/navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

function MoviePoster({ movie, large = false }) {
    return movie.poster_url ? (
        <img src={movie.poster_url} alt={`${movie.title} poster`} className={`h-full w-full object-cover ${large ? "" : "transition duration-500 group-hover:scale-105"}`} />
    ) : (
        <div className="flex h-full items-center justify-center bg-linear-to-br from-indigo-950 to-slate-950 p-5 text-center font-serif text-xl text-white/50">{movie.title}</div>
    );
}

function MovieCard({ movie, onSelect }) {
    return (
        <button type="button" onClick={() => onSelect(movie)} className="group text-left">
            <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl shadow-black/20">
                <MoviePoster movie={movie} />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#060a17] via-[#060a17]/70 to-transparent px-3 pb-3 pt-10"><div className="flex items-center justify-between gap-2 text-xs text-white/60"><span>{movie.year || "Unknown year"}</span>{movie.local_rating && <span className="text-amber-300">★ {movie.local_rating.toFixed(1)}</span>}</div></div>
            </div>
            <h3 className="mt-3 line-clamp-1 font-serif text-lg text-white group-hover:text-indigo-200">{movie.title}</h3>
        </button>
    );
}

function LoadingGrid() {
    return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="aspect-2/3 animate-pulse rounded-xl bg-white/10" />)}</div>;
}

function RecommendationSection({ title, movies, onSelect }) {
    if (!movies.length) return null;
    return <section><div className="mb-5 flex items-end justify-between"><h2 className="font-serif text-3xl">{title}</h2><span className="text-sm text-white/35">{movies.length} films</span></div><div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">{movies.map((movie) => <MovieCard key={movie.imdb_id || movie.title} movie={movie} onSelect={onSelect} />)}</div></section>;
}

function MovieModal({ movie, onClose }) {
    return <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={movie.title} onClick={onClose}><div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#111a35] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><h2 className="font-serif text-3xl">{movie.title}</h2><button type="button" onClick={onClose} className="text-2xl text-white/50 hover:text-white" aria-label="Close movie details">×</button></div><p className="mt-4 text-white/55">{movie.year || "Year unavailable"}</p><Button color="secondary" size="lg" className="mt-6 w-full border border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white" onPress={onClose}>Close details</Button></div></div>;
}

export default function MovieFinder() {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("popular");
    const [homeMovies, setHomeMovies] = useState([]);
    const [bundle, setBundle] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        fetch(`${API_URL}/home?sort=${sort}&limit=10`, { signal: controller.signal })
            .then((response) => { if (!response.ok) throw new Error("The movie service is unavailable."); return response.json(); })
            .then(setHomeMovies)
            .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [sort]);

    async function searchMovies(event) {
        event.preventDefault();
        const cleanQuery = query.trim();
        if (!cleanQuery) return;
        setSearching(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/search/movies?query=${encodeURIComponent(cleanQuery)}&tfidf_top_n=10&genre_limit=10`);
            if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.detail || "No movie recommendations were found."); }
            setBundle(await response.json());
        } catch (requestError) { setError(requestError.message); setBundle(null); } finally { setSearching(false); }
    }

    const searchRecommendations = bundle?.tfidf_recommendations.map((item) => item.omdb || { title: item.title, poster_url: null, year: null, local_rating: null }) || [];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_20%_0%,#172b58_0%,#080f25_48%,#050711_100%)] text-white">
            <Navbar />
            <main className="mx-auto max-w-7xl px-5 py-10 sm:px-10 sm:py-16">
                <section className="reveal-up rounded-3xl border border-white/10 bg-white/4 px-6 py-10 shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-12 sm:py-14">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/60">CineMatch movie room</p>
                    <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-7xl">What are you in the mood to watch?</h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-white/50">Search for one film and we&apos;ll find stories with a similar rhythm, feeling, and world.</p>
                    <form onSubmit={searchMovies} className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="movie-search">Search for a movie</label><input id="movie-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Inception, Interstellar, or Parasite" className="min-h-14 flex-1 rounded-xl border border-white/15 bg-black/20 px-5 text-white outline-none placeholder:text-white/30 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-300/20" /><Button type="submit" size="lg" color="primary" isLoading={searching} showTextWhileLoading className="min-h-14 bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-950/50 hover:from-indigo-400 hover:to-violet-400">Find matches</Button></form>
                </section>
                {error && <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100" role="alert">{error} Make sure the FastAPI server is running at {API_URL}.</div>}
                {bundle ? (
                    <section className="reveal-up-delay mt-14 space-y-12">
                        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:flex-row sm:p-7"><div className="h-72 w-48 shrink-0 overflow-hidden rounded-xl bg-white/5"><MoviePoster movie={bundle.movie_details} large /></div><div className="flex flex-col justify-center"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200/60">Your match</p><h2 className="mt-3 font-serif text-4xl">{bundle.movie_details.title}</h2><div className="mt-3 flex flex-wrap gap-2 text-sm text-white/50"><span>{bundle.movie_details.year}</span><span>·</span><span>{bundle.movie_details.runtime || "Runtime unavailable"}</span>{bundle.movie_details.imdb_rating && <><span>·</span><span className="text-amber-300">★ {bundle.movie_details.imdb_rating}</span></>}</div><div className="mt-4 flex flex-wrap gap-2">{bundle.movie_details.genres.map((genre) => <span key={genre} className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-xs text-indigo-100/80">{genre}</span>)}</div><p className="mt-5 max-w-2xl leading-7 text-white/60">{bundle.movie_details.plot || "No plot summary is available for this movie."}</p></div></div>
                        <RecommendationSection title="Because you liked this" movies={searchRecommendations} onSelect={setSelectedMovie} />
                        <RecommendationSection title="More from the same genres" movies={bundle.genre_recommendations} onSelect={setSelectedMovie} />
                    </section>
                ) : (
                      <section className="reveal-up-delay mt-14"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">Explore the collection</p><h2 className="mt-2 font-serif text-3xl">Popular right now</h2></div><div className="flex rounded-lg border border-white/10 bg-white/5 p-1"><button type="button" onClick={() => setSort("popular")} className={`rounded-md px-3 py-2 text-sm ${sort === "popular" ? "bg-white/15 text-white" : "text-white/40"}`}>Popular</button><button type="button" onClick={() => setSort("top_rated")} className={`rounded-md px-3 py-2 text-sm ${sort === "top_rated" ? "bg-white/15 text-white" : "text-white/40"}`}>Top rated</button></div></div>{loading ? <LoadingGrid /> : <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">{homeMovies.map((movie) => <MovieCard key={movie.imdb_id || movie.title} movie={movie} onSelect={setSelectedMovie} />)}</div>}</section>
                )}
            </main>
            {selectedMovie && <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
        </div>
    );
}