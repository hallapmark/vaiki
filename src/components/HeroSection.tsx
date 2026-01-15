import { Link } from "react-router";
import type { Movie } from "../api/api";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[60vh] min-h-100 w-full overflow-hidden md:h-[70vh] md:min-h-125">
      {/* Background image with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover"
        />
        {/* gradients for better readability */}
        <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Overall setup: [relative container, then absolute and relative children] allows us to
      add a background image by creating a z-stack. First the background image (absolute) fills the container, 
      then the following content ignores the xy-positioning of that image (elements ignore absolute-positioned 
      elements xy-wise); at the same time, since the content comes later in the DOM stack, it is placed on top 
      of the image (z-stacking)*/}

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-12 md:items-center md:pb-0 lg:px-8">
        <div className="max-w-2xl">
          {/* Featured Badge */}
          <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 md:px-4 md:py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs uppercase tracking-wider text-primary md:text-sm">
                {movie.featureText}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground md:mb-4 md:text-5xl lg:text-6xl">
            {movie.title}
          </h1>

          {/* Metadata */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:mb-6 md:gap-4 md:text-sm">
            <span>{movie.year}</span>
            <span>•</span>
            <span>{movie.durationMinutes} min</span>
            {movie.director && (
              <>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">{movie.director}</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="mb-6 line-clamp-3 max-w-xl text-base leading-relaxed text-foreground/90 md:mb-8 md:line-clamp-none md:text-lg">
            {movie.description}
          </p>

          {/* CTA Button */}
          <Link
            to={`/movie/${movie.slug}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:gap-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background md:px-8 md:py-3"
          >
            View Details
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>
      </div>

      {/* Bottom fade to blend with content below */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent md:h-32" />
    </section>
  );
}
