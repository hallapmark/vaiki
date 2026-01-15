export interface Movie {
  slug: string;
  title: string;
  year: number;
  description: string;
  durationMinutes: number;
  posterUrl: string;
  backdropUrl?: string;
  categories: string[];
  director?: string;
  country?: string;
  hlsMasterUrl?: string; // Placeholder for signed CloudFront URL
  playbackUrl?: string; // Dev/test HLS URL (stubbed for now)
}

// Mock movie data - using high-quality cinematic images from Unsplash
export const movies: Movie[] = [
  {
    slug: "metropolis",
    title: "Metropolis",
    year: 1927,
    description:
      "In a futuristic city sharply divided between the working class and the city planners, the son of the city's mastermind falls in love with a working class prophet who predicts the coming of a savior to mediate their differences.",
    durationMinutes: 153,
    posterUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Silent Cinema"],
    director: "Fritz Lang",
    country: "Germany",
    // Dev/test HLS stream (Mux sample) — replace with signed URL in production
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  {
    slug: "nosferatu",
    title: "Nosferatu",
    year: 1922,
    description:
      "Vampire Count Orlok expresses interest in a new residence and real estate agent Hutter's wife. Silent expressionist horror that defined the vampire genre.",
    durationMinutes: 94,
    posterUrl:
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Silent Cinema"],
    director: "F.W. Murnau",
    country: "Germany",
  },
  {
    slug: "all-quiet-western-front",
    title: "All Quiet on the Western Front",
    year: 1930,
    description:
      "A young soldier faces profound disillusionment in the soul-destroying horror of World War I. A powerful anti-war statement that resonates across generations.",
    durationMinutes: 152,
    posterUrl:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Anti-war"],
    director: "Lewis Milestone",
    country: "United States",
  },
  {
    slug: "battleship-potemkin",
    title: "Battleship Potemkin",
    year: 1925,
    description:
      "In the midst of the Russian Revolution of 1905, the crew of the battleship Potemkin mutiny against their officers. Revolutionary cinema in both form and content.",
    durationMinutes: 75,
    posterUrl:
      "https://images.unsplash.com/photo-1589519160142-c3c60a820744?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1589519160142-c3c60a820744?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Silent Cinema", "Anti-war"],
    director: "Sergei Eisenstein",
    country: "Soviet Union",
  },
  {
    slug: "cabinet-dr-caligari",
    title: "The Cabinet of Dr. Caligari",
    year: 1920,
    description:
      "Hypnotist Dr. Caligari uses a somnambulist to commit murders. A groundbreaking work of German Expressionist cinema with striking visual design.",
    durationMinutes: 71,
    posterUrl:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Silent Cinema"],
    director: "Robert Wiene",
    country: "Germany",
  },
  {
    slug: "man-with-movie-camera",
    title: "Man with a Movie Camera",
    year: 1929,
    description:
      "A man travels around a city with a camera slung over his shoulder, documenting urban life with dazzling inventiveness. An experimental documentary masterpiece.",
    durationMinutes: 68,
    posterUrl:
      "https://images.unsplash.com/photo-1574267432644-f610a5346f1c?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1574267432644-f610a5346f1c?w=1920&h=1080&fit=crop",
    categories: ["Silent Cinema", "Classics"],
    director: "Dziga Vertov",
    country: "Soviet Union",
  },
  {
    slug: "general",
    title: "The General",
    year: 1926,
    description:
      "When Union spies steal an engineer's beloved locomotive, he pursues it single-handedly and straight through enemy lines. A comedy masterpiece of physical stunts.",
    durationMinutes: 78,
    posterUrl:
      "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1920&h=1080&fit=crop",
    categories: ["Silent Cinema", "Classics"],
    director: "Buster Keaton",
    country: "United States",
  },
  {
    slug: "city-lights",
    title: "City Lights",
    year: 1931,
    description:
      "With the aid of a wealthy erratic tippler, a dewy-eyed tramp falls in love with a flower girl. Chaplin's most emotionally powerful work.",
    durationMinutes: 87,
    posterUrl:
      "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1920&h=1080&fit=crop",
    categories: ["Silent Cinema", "Classics"],
    director: "Charlie Chaplin",
    country: "United States",
  },
  {
    slug: "grand-illusion",
    title: "Grand Illusion",
    year: 1937,
    description:
      "During WWI, two French soldiers are captured and imprisoned in a German P.O.W. camp. A humanistic look at the futility of war and class barriers.",
    durationMinutes: 114,
    posterUrl:
      "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Anti-war"],
    director: "Jean Renoir",
    country: "France",
  },
  {
    slug: "paths-of-glory",
    title: "Paths of Glory",
    year: 1957,
    description:
      "After refusing to attack an enemy position, a general accuses his soldiers of cowardice and their commanding officer must defend them. A searing indictment of military injustice.",
    durationMinutes: 88,
    posterUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1920&h=1080&fit=crop",
    categories: ["Classics", "Anti-war"],
    director: "Stanley Kubrick",
    country: "United States",
  },
];

// Helper function to get movies by category
export function getMoviesByCategory(category: string): Movie[] {
  return movies.filter((movie) => movie.categories.includes(category));
}

// Helper function to get movie by slug
export function getMovieBySlug(slug: string): Movie | undefined {
  return movies.find((movie) => movie.slug === slug);
}

// Get featured movie (first one for now)
export function getFeaturedMovie(): Movie {
  return movies[0];
}

// Return a playback URL for a movie (stubbed for now)
export function getPlaybackUrl(slug: string): string | undefined {
  const movie = getMovieBySlug(slug);
  return movie?.playbackUrl;
}
