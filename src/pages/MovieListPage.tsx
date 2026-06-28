import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { MovieGridSection } from '../components/MovieGridSection';
import {
  fetchMovies,
  fetchCategories,
  fetchFeaturedMovie,
  getMoviesByCategory,
  type Movie,
  type Category
} from '../api/api';

export function MovieListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [moviesData, categoriesData, featured] = await Promise.all([
          fetchMovies(),
          fetchCategories(),
          fetchFeaturedMovie()
        ]);

        setMovies(moviesData);
        setCategories(categoriesData);
        setFeaturedMovie(featured ?? moviesData[0] ?? null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground">Loading ....</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading content</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {featuredMovie && <HeroSection movie={featuredMovie} />}

      {/* Movie Grid Sections - one per category */}
      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        {categories.map((category) => {
          const categoryMovies = getMoviesByCategory(movies, category.slug);
          return (
            <MovieGridSection
              key={category.slug}
              title={category.title}
              movies={categoryMovies}
            />
          );
        })}
      </div>
    </div>
  );
}