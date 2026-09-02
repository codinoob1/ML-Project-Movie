import { Button } from "@/components/base/buttons/button";
export default function Navbar() {
  return (
    <nav className="w-full border-b border-white/10 bg-[#080f25]/90 text-white backdrop-blur-xl">
      <div className="flex min-h-22 items-center justify-between gap-6 px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg shadow-inner shadow-white/10" aria-hidden="true">
            🎬
          </div>
          <span className="font-serif text-xl font-bold tracking-tight sm:text-2xl">CineMatch</span>
        </div>
        <div className="hidden items-center gap-3 sm:flex sm:gap-5">
          <span className="hidden text-sm font-semibold text-white/40 sm:inline">Movie Recommendation Engine</span>
          <Button color="secondary" size="lg" className="border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            Open App &rarr;
          </Button>
        </div>
      </div>
    </nav>
  );
}
