import type { Movie } from "../data/movies";
import { MovieCard } from "./MovieCard";

interface MovieGridSectionProps {
  title: string;
  movies: Movie[];
}

export function MovieGridSection({ title, movies }: MovieGridSectionProps) {
  if (movies.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      {/* Section Title */}
      <h2 className="mb-4 text-xl font-semibold text-foreground md:mb-6 md:text-2xl">
        {title}
      </h2>

      {/* Movie Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>
    </section>
  );
}
