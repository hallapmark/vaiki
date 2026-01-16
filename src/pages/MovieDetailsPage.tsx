import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { MovieNotFound } from "../components/MovieNotFound";
import { fetchMovieBySlug, fetchPlaybackUrl, type Movie } from "../api/api";
import { HlsPlayer } from "../components/HlsPlayer";
import { ArrowLeft, Clock } from "lucide-react";

export function MovieDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMovie() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        const movieData = await fetchMovieBySlug(slug);
        setMovie(movieData);

        if (movieData) {
          // Fetch playback URL
          try {
            const playback = await fetchPlaybackUrl(slug);
            setPlaybackUrl(playback.url);
          } catch (err) {
            console.warn('Playback URL not available:', err);
            // Not a critical error - movie may not have HLS content yet
          }
        }
      } catch (err) {
        console.error('Failed to load movie:', err);
        setError(err instanceof Error ? err.message : 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    }

    void loadMovie();
  }, [slug]);

  const backClicked = () => {
    // see useNavigate docs, very odd setup from React Router here for ts.
    // 'false positive' Promise error ...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
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
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary group">
              {/* HLS Player */}
              <div className="h-full w-full">
                <HlsPlayer
                  src={playbackUrl ?? ""}
                  className="w-full h-full"
                />
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
              {/* <div className="border-t border-border pt-4">
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
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
