"use client";

import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import Navbar from "./components/navbar";
import MovieCard from "./components/movie-card";
import Link from "next/link";

const movies = [
  {
    title: "Interstellar",
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    imageUrl: "https://image.tmdb.org/t/p/original/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    tags: ["Sci-Fi"],
    year: "2014",
    rating: "8.7",
  },
  {
    title: "The Grand Budapest Hotel",
    description:
      "A legendary concierge and his lobby boy become wrapped up in a priceless painting and a family fortune.",
    imageUrl: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    tags: ["Comedy", "Drama"],
    year: "2014",
    rating: "8.1",
  },
  {
    title: "La La Land",
    description:
      "A jazz pianist and an aspiring actress fall in love while pursuing their dreams in Los Angeles.",
    imageUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
    tags: ["Romance", "Musical"],
    year: "2016",
    rating: "8.0",
  },
  {
    title: "Knives Out",
    description:
      "A detective investigates a novelist's mysterious death while every member of the family hides a secret.",
    imageUrl: "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
    tags: ["Thriller", "Mystery"],
    year: "2019",
    rating: "7.9",
  },
];

const tags = ["All", "Sci-Fi", "Drama", "Romance", "Thriller", "Comedy"];

export default function Home() {
  const [activeTag, setActiveTag] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const visibleMovies =
    activeTag === "All"
      ? movies
      : movies.filter((movie) => movie.tags.includes(activeTag));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_30%_20%,#172b58_0%,#080f25_48%,#050711_100%)] text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-20">
        <section className="reveal-up max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/60">
            Your personal movie room
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] text-white sm:text-7xl">
            Find your next
            <br />
            <span className="bg-linear-to-r from-blue-200 via-violet-300 to-fuchsia-200 bg-clip-text text-transparent">
              favorite film.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Discover movies that match your mood, your taste, and the stories
            you keep coming back to.
          </p>
        </section>
        <section
          className="reveal-up-delay mt-16"
          aria-labelledby="recommendations-heading"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200/60">
                Curated for you
              </p>
              <h2
                id="recommendations-heading"
                className="mt-2 font-serif text-3xl"
              >
                Recommended tonight
              </h2>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter movies by genre"
            >
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  aria-pressed={activeTag === tag}
                  className={`rounded-full border px-3.5 py-2 text-sm transition ${activeTag === tag ? "border-indigo-300/50 bg-indigo-300/20 text-white" : "border-white/10 bg-white/4 text-white/45 hover:border-white/25 hover:text-white"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleMovies.map((movie) => (
              <MovieCard
                key={movie.title}
                movie={movie}
                onSelect={setSelectedMovie}
              />
            ))}
          </div>
          {visibleMovies.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-white/50">
              No films match this tag yet.
            </p>
          )}
        </section>
        {selectedMovie && (
          <div
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={selectedMovie.title}
            onClick={() => setSelectedMovie(null)}
          >
            <div
              className="max-w-md rounded-2xl border border-white/15 bg-[#111a35] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-200/60">
                Now playing in your list
              </p>
              <h2 className="mt-3 font-serif text-3xl">
                {selectedMovie.title}
              </h2>
              <p className="mt-3 leading-7 text-white/60">
                {selectedMovie.description}
              </p>
              <Button
                color="secondary"
                size="lg"
                className="mt-6 border border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                onPress={() => setSelectedMovie(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </main>
      
    </div>
  );
}
