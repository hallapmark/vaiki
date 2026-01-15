/**
 * API client for backend services.
 * Uses VITE_BACKEND_URL from environment, defaulting to localhost:8080.
 */

const BACKEND_URL: string = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:8080';

// Types matching backend DTOs
export interface Movie {
  slug: string;
  title: string;
  year: number;
  description: string;
  durationMinutes: number;
  posterUrl: string;
  backdropUrl?: string;
  categories: string[]; // category slugs
  director?: string;
  country?: string;
  featured: boolean;
}

export interface Category {
  slug: string;
  title: string;
  orderIndex: number;
}

export interface PlaybackUrlResponse {
  url: string;
  expiresAt: string; // ISO timestamp
}

/**
 * Fetch all movies from the backend.
 */
export async function fetchMovies(): Promise<Movie[]> {
  const response = await fetch(`${BACKEND_URL}/api/movies`);
  if (!response.ok) {
    throw new Error(`Failed to fetch movies: ${response.status}`);
  }
  return response.json() as Promise<Movie[]>;
}

/**
 * Fetch a single movie by slug.
 */
export async function fetchMovieBySlug(slug: string): Promise<Movie | null> {
  const response = await fetch(`${BACKEND_URL}/api/movies/${encodeURIComponent(slug)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch movie: ${response.status}`);
  }
  return response.json() as Promise<Movie>;
}

/**
 * Fetch the featured movie.
 */
export async function fetchFeaturedMovie(): Promise<Movie | null> {
  const response = await fetch(`${BACKEND_URL}/api/movies/featured`);
  if (response.status === 204 || response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch featured movie: ${response.status}`);
  }
  return response.json() as Promise<Movie>;
}

/**
 * Fetch all visible categories ordered by orderIndex.
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${BACKEND_URL}/api/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }
  return response.json() as Promise<Category[]>;
}

/**
 * Get a signed playback URL for a movie.
 * @param slug Movie slug
 * @param ttl Optional TTL in seconds
 */
export async function fetchPlaybackUrl(slug: string, ttl?: number): Promise<PlaybackUrlResponse> {
  const params = ttl ? `?ttl=${ttl}` : '';
  const response = await fetch(`${BACKEND_URL}/api/movies/${encodeURIComponent(slug)}/playback-url${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch playback URL: ${response.status}`);
  }
  return response.json() as Promise<PlaybackUrlResponse>;
}

/**
 * Get movies filtered by category slug.
 */
export function getMoviesByCategory(movies: Movie[], categorySlug: string): Movie[] {
  return movies.filter(movie => movie.categories.includes(categorySlug));
}
