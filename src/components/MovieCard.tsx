import { Link } from "react-router";
import type { Movie } from "../data/movies";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      to={`/movie/${movie.slug}`}
      className="group relative block overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-100"
    >
      {/* Poster Image */}
      <div className="relative aspect-2/3 overflow-hidden bg-secondary">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-80"
          loading="lazy"
          decoding="async"
        />

        {/* Overlay with Title & Year - Appears on Hover */}
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/95 via-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-4">
          <h3 className="text-base font-semibold text-white md:text-lg">
            {movie.title}
          </h3>
          <p className="text-xs text-gray-300 md:text-sm">{movie.year}</p>
        </div>
      </div>
    </Link>
  );
}
