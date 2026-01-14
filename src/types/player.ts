/**
 * Player Types & Interfaces
 *
 * Shared type definitions for the HLS player system.
 */

/**
 * Sprite metadata for scrub preview thumbnails.
 *
 * Each sprite image is a grid of thumbnails (cols x rows).
 * Multiple sprite images can be used for longer videos.
 *
 * Example: For a 2-hour movie with 15s interval:
 * - Total thumbnails: 480 (7200s / 15s)
 * - With 5x5 sprites: 20 sprite images (480 / 25)
 */
export type SpriteMeta = {
  /** Base path for sprite images, e.g. "/sprites/movie-123/sprite_" */
  spriteBaseUrl: string;
  /** Total number of sprite images (sprite_000.jpg, sprite_001.jpg, etc.) */
  spriteCount: number;
  /** Width of each thumbnail in pixels */
  thumbWidth: number;
  /** Height of each thumbnail in pixels */
  thumbHeight: number;
  /** Number of thumbnail columns in each sprite image */
  cols: number;
  /** Number of thumbnail rows in each sprite image */
  rows: number;
  /** Interval between thumbnails in seconds (e.g., 15) */
  intervalSeconds: number;
};

/**
 * Quality level information from HLS manifest.
 */
export type QualityLevel = {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
};

/**
 * Player state exposed by usePlayback hook.
 */
export type PlayerState = {
  isLoading: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isReady: boolean;
  isError: boolean;
  error: Error | null;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  prebufferProgress: number; // 0 to 1, tracks actual readiness for initial playback
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  qualityLevels: QualityLevel[];
  currentQuality: number; // -1 for auto
  autoSelectedLevel: number; // The level hls.js actually selected in auto mode
};

/**
 * Player controls exposed by usePlayback hook.
 */
export type PlayerControls = {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setQuality: (levelIndex: number) => void;
  toggleFullscreen: () => Promise<void>;
  retry: () => void;
};

/**
 * HLS Player component props.
 */
export type HlsPlayerProps = {
  /** Movie ID used to fetch the playback URL */
  movieId: string;
  /** Poster image shown before playback starts */
  posterUrl?: string;
  /** Whether to preload manifest on mount (default: false, loads on play) */
  preload?: boolean;
  /** Optional bandwidth throttle during preload phase */
  preloadBandwidthThrottle?: boolean;
  /** Seconds to buffer before auto-starting playback (default: 2) */
  prebufferSeconds?: number;
  /** Callback when player is ready to play */
  onReady?: () => void;
  /** Callback when an error occurs */
  onError?: (err: Error) => void;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Sprite metadata for scrub preview thumbnails */
  spriteMeta?: SpriteMeta | null;
  /** Short clip URL for hover preview (future) */
  previewClipUrl?: string | null;
};

/**
 * Scrub Preview component props.
 */
export type ScrubPreviewProps = {
  /** Sprite metadata for thumbnail generation */
  spriteMeta: SpriteMeta;
  /** Current hover time in seconds (from seek bar) */
  hoverTime: number;
  /** Whether preview is visible */
  isVisible: boolean;
  /** Horizontal position for the preview popup (percentage 0-100) */
  positionPercent: number;
  /** Additional CSS classes */
  className?: string;
};

/**
 * Hover Preview component props (for movie cards).
 */
export type HoverPreviewProps = {
  /** Short video clip URL for hover playback */
  previewClipUrl?: string | null;
  /** Sprite metadata for animated thumbnail preview */
  spriteMeta?: SpriteMeta | null;
  /** Whether to show the preview */
  isActive: boolean;
  /** Additional CSS classes */
  className?: string;
};
