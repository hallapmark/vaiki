
import { MovieGridSection } from '../components/MovieGridSection';
import { getMoviesByCategory } from '../data/movies';

export function MovieListPage() {
  const classicsMovies = getMoviesByCategory('Classics');
  const antiWarMovies = getMoviesByCategory('Anti-war');
  const silentCinemaMovies = getMoviesByCategory('Silent Cinema');

  return (
    <div className="min-h-screen bg-background">

      {/* Movie Grid Sections */}
      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <MovieGridSection 
          title="Classics" 
          movies={classicsMovies.slice(0, 6)} 
        />
        
        <MovieGridSection 
          title="Anti-war Cinema" 
          movies={antiWarMovies} 
        />
        
        <MovieGridSection 
          title="Silent & Early Cinema" 
          movies={silentCinemaMovies.slice(0, 6)} 
        />
      </div>

    </div>
  );
}