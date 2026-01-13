import { useParams, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { MovieNotFound } from "../components/MovieNotFound";
import { getMovieBySlug } from "../data/movies";
import { ArrowLeft, Play, Clock } from "lucide-react";

export function MovieDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const movie = slug ? getMovieBySlug(slug) : undefined;

  const backClicked = () => {
    // see useNavigate docs, very odd setup from React Router here for ts.
    // 'false positive' Promise error ...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    navigate("/");
  };

  if (!movie) {
    return <MovieNotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => backClicked()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Video Player Placeholder */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary">
              {/* Placeholder for HLS Player */}
              <div className="flex h-full flex-col items-center justify-center bg-linear-to-br from-secondary to-background/50">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
                  <Play
                    className="h-10 w-10 text-primary"
                    fill="currentColor"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Video player will be integrated here
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  HLS streaming with signed CloudFront URLs
                </p>
              </div>

              {/* Play Button Overlay (for visual design) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm">
                  <Play
                    className="h-8 w-8 text-primary-foreground"
                    fill="currentColor"
                  />
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="space-y-6">
              <div>
                <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                  {movie.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {movie.durationMinutes} min
                  </span>
                  <span>•</span>
                  <span>{movie.year}</span>
                  {movie.country && (
                    <>
                      <span>•</span>
                      <span>{movie.country}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="mb-3 text-xl font-semibold">Synopsis</h2>
                <p className="leading-relaxed text-foreground/90">
                  {movie.description}
                </p>
              </div>

              {/* Categories */}
              <div>
                <h2 className="mb-3 text-xl font-semibold">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Poster */}
            <div className="overflow-hidden rounded-lg">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-auto w-full object-cover"
              />
            </div>

            {/* Metadata */}
            <div className="space-y-4 rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold">Details</h3>

              {movie.director && (
                <div>
                  <dt className="text-sm text-muted-foreground">Director</dt>
                  <dd className="mt-1">{movie.director}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-muted-foreground">Year</dt>
                <dd className="mt-1">{movie.year}</dd>
              </div>

              <div>
                <dt className="text-sm text-muted-foreground">Runtime</dt>
                <dd className="mt-1">{movie.durationMinutes} minutes</dd>
              </div>

              {movie.country && (
                <div>
                  <dt className="text-sm text-muted-foreground">Country</dt>
                  <dd className="mt-1">{movie.country}</dd>
                </div>
              )}

              {/* Quality selector will go here */}
              <div className="border-t border-border pt-4">
                <dt className="text-sm text-muted-foreground">
                  Available Quality
                </dt>
                <dd className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    1080p (Pending)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    720p (Pending)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    480p (Pending)
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
