/**
 * usePlayback Hook
 *
 * Abstracts HLS player initialization, cleanup, and controls.
 * Provides a clean API for controlling video playback with state tracking.
 *
 * Usage:
 * ```tsx
 * const { state, controls, videoRef, initPlayer } = usePlayback({
 *   movieId: 'metropolis',
 *   prebufferSeconds: 2,
 *   onReady: () => console.log('Ready to play!'),
 *   onError: (err) => console.error('Playback error:', err),
 * });
 * ```
 */

import { useRef, useState, useCallback, useEffect } from "react";
import Hls, { type HlsConfig, type Level, Events, ErrorTypes } from "hls.js";
import type {
  PlayerState,
  PlayerControls,
  QualityLevel,
} from "../types/player";
import { getPlaybackUrl } from "../data/movies";

// ─────────────────────────────────────────────────────────────────────────────
// HLS.js Configuration
// Tune these values based on your streaming needs
// ─────────────────────────────────────────────────────────────────────────────
const HLS_CONFIG: Partial<HlsConfig> = {
  enableWorker: true,
  lowLatencyMode: false,
  // Buffer settings - buffer ahead for smoother playback
  maxBufferLength: 90, // Max buffer ahead in seconds
  maxMaxBufferLength: 180, // Absolute max buffer
  maxBufferSize: 100 * 1000 * 1000, // 100MB max buffer size
  maxBufferHole: 0.5, // Max gap to jump in buffer
  // Start loading settings
  startFragPrefetch: true, // Prefetch next fragment for smoother playback
  // ABR settings - start with moderate quality estimate to prefer 720p on start
  abrEwmaDefaultEstimate: 2500000, // Initial bandwidth estimate (2.5Mbps) - prefer 720p start
  abrBandWidthFactor: 0.95, // Bandwidth safety factor
  abrBandWidthUpFactor: 0.7, // Factor for upgrading quality
  // Start level - prefer higher quality
  startLevel: -1, // -1 means auto, but with high bandwidth estimate will pick high quality
};

// Safety timeout for prebuffer (in ms)
const PREBUFFER_TIMEOUT_MS = 8000;

export interface UsePlaybackOptions {
  movieId: string;
  prebufferSeconds?: number;
  preload?: boolean;
  onReady?: () => void;
  onError?: (err: Error) => void;
}

export interface UsePlaybackReturn {
  state: PlayerState;
  controls: PlayerControls;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  initPlayer: () => void;
  destroy: () => void;
}

/**
 * Helper to format quality level label
 */
function formatQualityLabel(height: number): string {
  if (height >= 1080) return "HD (1080p)";
  if (height >= 720) return "HD (720p)";
  if (height >= 480) return "SD (480p)";
  if (height >= 360) return "SD (360p)";
  return `${height}p`;
}

/**
 * Convert HLS.js levels to our QualityLevel format
 */
function mapLevels(levels: Level[]): QualityLevel[] {
  return levels.map((level, index) => ({
    index,
    height: level.height,
    width: level.width,
    bitrate: level.bitrate,
    label: formatQualityLabel(level.height),
  }));
}

export function usePlayback({
  movieId,
  prebufferSeconds = 2.5,
  preload = false,
  onReady,
  onError,
}: UsePlaybackOptions): UsePlaybackReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const prebufferTimeoutRef = useRef<number | null>(null);
  const isInitializingRef = useRef(false);

  const [state, setState] = useState<PlayerState>({
    isLoading: false,
    isBuffering: false,
    isPlaying: false,
    isPaused: true,
    isReady: false,
    isError: false,
    error: null,
    currentTime: 0,
    duration: 0,
    bufferedEnd: 0,
    prebufferProgress: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    qualityLevels: [],
    currentQuality: -1,
    autoSelectedLevel: -1,
  });

  /**
   * Update state partially
   */
  const updateState = useCallback((partial: Partial<PlayerState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  /**
   * Check if we have enough buffer to start playback
   */
  const hasEnoughBuffer = useCallback((): boolean => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return false;

    const buffered = video.buffered;
    if (buffered.length === 0) return false;

    // Find buffer range containing current time
    for (let i = 0; i < buffered.length; i++) {
      if (
        buffered.start(i) <= video.currentTime &&
        video.currentTime < buffered.end(i)
      ) {
        const bufferedAhead = buffered.end(i) - video.currentTime;
        return bufferedAhead >= prebufferSeconds;
      }
    }
    return false;
  }, [prebufferSeconds]);

  /**
   * Calculate prebuffer progress (0 to 1) using same logic as hasEnoughBuffer
   */
  const getPrebufferProgress = useCallback((): number => {
    const video = videoRef.current;
    if (!video) return 0;

    // Need duration to be ready
    if (video.duration === 0) {
      // Duration not available yet - cap at 50%
      const buffered = video.buffered;
      if (buffered.length === 0) return 0;
      // Show some progress based on raw buffer, but cap it
      const rawProgress = buffered.end(buffered.length - 1) / prebufferSeconds;
      return Math.min(0.5, rawProgress);
    }

    const buffered = video.buffered;
    if (buffered.length === 0) return 0;

    // Find buffer range containing current time (same logic as hasEnoughBuffer)
    for (let i = 0; i < buffered.length; i++) {
      if (
        buffered.start(i) <= video.currentTime &&
        video.currentTime < buffered.end(i)
      ) {
        const bufferedAhead = buffered.end(i) - video.currentTime;
        return Math.min(1, bufferedAhead / prebufferSeconds);
      }
    }

    // Buffer doesn't contain currentTime yet
    // This can happen if buffer starts slightly after 0
    // Show partial progress but cap it
    const rawProgress = buffered.end(buffered.length - 1) / prebufferSeconds;
    return Math.min(0.7, rawProgress);
  }, [prebufferSeconds]);

  /**
   * Get current buffered end time
   */
  const getBufferedEnd = useCallback((): number => {
    const video = videoRef.current;
    if (!video) return 0;

    const buffered = video.buffered;
    if (buffered.length === 0) return 0;

    // Return the end of the last buffer range
    return buffered.end(buffered.length - 1);
  }, []);

  /**
   * Start playback when buffer is ready
   */
  const startPlaybackWhenReady = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // Clear any existing timeout
    if (prebufferTimeoutRef.current) {
      window.clearTimeout(prebufferTimeoutRef.current);
      prebufferTimeoutRef.current = null;
    }

    // Check if we have enough buffer
    if (hasEnoughBuffer()) {
      updateState({ isLoading: false, isReady: true });
      onReady?.();
      try {
        await video.play();
        updateState({ isPlaying: true, isPaused: false });
      } catch (err) {
        console.error("Play failed:", err);
        updateState({
          isError: true,
          error: err instanceof Error ? err : new Error("Play failed"),
        });
        onError?.(err instanceof Error ? err : new Error("Play failed"));
      }
      return;
    }

    // Not enough buffer yet, wait for progress event
    const handleProgress = () => {
      // Update buffered progress and duration during initial load
      updateState({
        bufferedEnd: getBufferedEnd(),
        duration: video.duration || 0,
        prebufferProgress: getPrebufferProgress(),
      });

      if (hasEnoughBuffer()) {
        video.removeEventListener("progress", handleProgress);
        video.removeEventListener("durationchange", handleDurationChange);
        if (prebufferTimeoutRef.current) {
          window.clearTimeout(prebufferTimeoutRef.current);
          prebufferTimeoutRef.current = null;
        }
        updateState({ isLoading: false, isReady: true });
        onReady?.();
        video.play().catch((err) => {
          console.error("Play failed:", err);
        });
        updateState({ isPlaying: true, isPaused: false });
      }
    };

    // Also listen for duration changes (needed for hasEnoughBuffer)
    const handleDurationChange = () => {
      updateState({
        duration: video.duration,
        prebufferProgress: getPrebufferProgress(),
      });
      // Re-check buffer when duration becomes available
      if (hasEnoughBuffer()) {
        video.removeEventListener("progress", handleProgress);
        video.removeEventListener("durationchange", handleDurationChange);
        if (prebufferTimeoutRef.current) {
          window.clearTimeout(prebufferTimeoutRef.current);
          prebufferTimeoutRef.current = null;
        }
        updateState({ isLoading: false, isReady: true });
        onReady?.();
        video.play().catch((err) => {
          console.error("Play failed:", err);
        });
        updateState({ isPlaying: true, isPaused: false });
      }
    };

    video.addEventListener("progress", handleProgress);
    video.addEventListener("durationchange", handleDurationChange);

    // Safety timeout - start playing after timeout even if buffer isn't full
    prebufferTimeoutRef.current = window.setTimeout(() => {
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("durationchange", handleDurationChange);
      updateState({ isLoading: false, isReady: true });
      onReady?.();
      video.play().catch((err) => {
        console.error("Play failed after timeout:", err);
      });
      updateState({ isPlaying: true, isPaused: false });
    }, PREBUFFER_TIMEOUT_MS);
  }, [hasEnoughBuffer, updateState, onReady, onError]);

  /**
   * Initialize the player and start loading
   */
  const initPlayer = useCallback(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const video = videoRef.current;
    if (!video) {
      isInitializingRef.current = false;
      return;
    }

    updateState({ isLoading: true, isError: false, error: null });

    // Get the playback URL (this would call your backend in production)
    // TODO: Add signed URL header logic here when integrating with backend
    // Example: const url = await getSignedPlaybackUrl(movieId, authToken);
    const url = getPlaybackUrl(movieId);

    // Check for native HLS support (Safari, iOS)
    const canPlayNativeHls =
      video.canPlayType("application/vnd.apple.mpegurl") !== "";

    // Prefer hls.js when MSE is supported (works on modern Safari too!)
    // This gives us programmatic control over quality selection.
    // Only fall back to native HLS on iOS or old browsers where MSE isn't available.
    const useHlsJs = Hls.isSupported();

    console.log("[usePlayback] Init:", {
      url,
      hlsJsSupported: Hls.isSupported(),
      nativeHlsSupported: canPlayNativeHls,
      useHlsJs,
    });

    if (useHlsJs) {
      // Use hls.js for full control (works on Chrome, Firefox, and modern Safari)
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;

      hls.attachMedia(video);
      hls.loadSource(url);

      // Handle manifest parsed - quality levels available
      hls.on(Events.MANIFEST_PARSED, (_event, data) => {
        const levels = mapLevels(hls.levels);
        console.log("[usePlayback] MANIFEST_PARSED:", {
          levelsCount: data.levels.length,
          mappedLevels: levels,
          hlsLevels: hls.levels.map((l) => ({
            height: l.height,
            bitrate: l.bitrate,
          })),
        });
        updateState({
          qualityLevels: levels,
          duration: video.duration || 0,
        });
        void startPlaybackWhenReady();
      });

      // Handle level switch - track what quality is actually playing
      hls.on(Events.LEVEL_SWITCHED, (_, data) => {
        console.log("[usePlayback] LEVEL_SWITCHED:", {
          newLevel: data.level,
          levelInfo: hls.levels[data.level]
            ? {
                height: hls.levels[data.level].height,
                bitrate: hls.levels[data.level].bitrate,
              }
            : "unknown",
          currentLevel: hls.currentLevel,
          autoLevelEnabled: hls.autoLevelEnabled,
        });
        // Always track what level is actually playing (for Auto display)
        updateState({ autoSelectedLevel: data.level });
        // Only update currentQuality if user manually selected a level (not in auto mode)
        // Use autoLevelEnabled which correctly indicates if ABR is active
        if (!hls.autoLevelEnabled) {
          updateState({ currentQuality: data.level });
        }
      });

      // Handle errors
      hls.on(Events.ERROR, (_, data) => {
        if (data.fatal) {
          let errorMessage = "Playback error";
          switch (data.type) {
            case ErrorTypes.NETWORK_ERROR:
              errorMessage = "Network error - please check your connection";
              // Try to recover
              hls.startLoad();
              break;
            case ErrorTypes.MEDIA_ERROR:
              errorMessage = "Media error - trying to recover...";
              hls.recoverMediaError();
              break;
            default:
              errorMessage = `Fatal error: ${data.details}`;
              break;
          }
          const error = new Error(errorMessage);
          updateState({ isError: true, error, isLoading: false });
          onError?.(error);
        }
      });
    } else if (canPlayNativeHls) {
      // Fallback: Native HLS (iOS Safari, older browsers without MSE)
      // Note: Quality selection is not available with native HLS
      console.log("[usePlayback] Using native HLS fallback");
      video.src = url;
      video.load();

      video.addEventListener(
        "loadedmetadata",
        () => {
          updateState({ duration: video.duration });
          void startPlaybackWhenReady();
        },
        { once: true }
      );
    } else {
      // No HLS support at all
      const error = new Error(
        "Your browser does not support HLS playback. Please try Safari, Chrome, or Firefox."
      );
      updateState({ isError: true, error, isLoading: false });
      onError?.(error);
    }

    isInitializingRef.current = false;
  }, [movieId, updateState, startPlaybackWhenReady, onError]);

  /**
   * Cleanup player resources
   */
  const destroy = useCallback(() => {
    if (prebufferTimeoutRef.current) {
      window.clearTimeout(prebufferTimeoutRef.current);
      prebufferTimeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    isInitializingRef.current = false;
  }, []);

  /**
   * Player controls
   */
  const controls: PlayerControls = {
    play: async () => {
      const video = videoRef.current;
      if (!video) return;

      if (!state.isReady && !state.isLoading) {
        // First play - initialize
        initPlayer();
      } else if (video.paused) {
        try {
          await video.play();
          updateState({ isPlaying: true, isPaused: false });
        } catch (err) {
          console.error("Play failed:", err);
        }
      }
    },

    pause: () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
        updateState({ isPlaying: false, isPaused: true });
      }
    },

    togglePlay: () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        void controls.play();
      } else {
        controls.pause();
      }
    },

    seek: (time: number) => {
      const video = videoRef.current;
      if (video && isFinite(time)) {
        video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
      }
    },

    seekRelative: (delta: number) => {
      const video = videoRef.current;
      if (video) {
        controls.seek(video.currentTime + delta);
      }
    },

    setVolume: (volume: number) => {
      const video = videoRef.current;
      if (video) {
        video.volume = Math.max(0, Math.min(1, volume));
        updateState({ volume: video.volume, isMuted: video.volume === 0 });
      }
    },

    toggleMute: () => {
      const video = videoRef.current;
      if (video) {
        video.muted = !video.muted;
        updateState({ isMuted: video.muted });
      }
    },

    setQuality: (levelIndex: number) => {
      const hls = hlsRef.current;
      if (hls) {
        hls.currentLevel = levelIndex; // -1 for auto
        updateState({ currentQuality: levelIndex });
      }
    },

    toggleFullscreen: async () => {
      const video = videoRef.current;
      if (!video) return;

      const container = video.parentElement;
      if (!container) return;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          updateState({ isFullscreen: false });
        } else {
          await container.requestFullscreen();
          updateState({ isFullscreen: true });
        }
      } catch (err) {
        console.error("Fullscreen toggle failed:", err);
      }
    },

    retry: () => {
      destroy();
      updateState({
        isError: false,
        error: null,
        isLoading: false,
        isReady: false,
      });
      void initPlayer();
    },
  };

  /**
   * Set up video element event listeners
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      updateState({
        currentTime: video.currentTime,
        bufferedEnd: getBufferedEnd(),
      });
    };

    const handleDurationChange = () => {
      updateState({ duration: video.duration });
    };

    const handlePlay = () => {
      updateState({ isPlaying: true, isPaused: false });
    };

    const handlePause = () => {
      updateState({ isPlaying: false, isPaused: true });
    };

    const handleWaiting = () => {
      updateState({ isBuffering: true });
    };

    const handleCanPlay = () => {
      updateState({ isBuffering: false });
    };

    const handleVolumeChange = () => {
      updateState({ volume: video.volume, isMuted: video.muted });
    };

    const handleEnded = () => {
      updateState({ isPlaying: false, isPaused: true });
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ended", handleEnded);
    };
  }, [updateState, getBufferedEnd]);

  /**
   * Handle fullscreen changes
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      updateState({ isFullscreen: !!document.fullscreenElement });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [updateState]);

  /**
   * Preload on mount if enabled
   */
  useEffect(() => {
    if (preload) {
      void initPlayer();
    }
  }, [preload, initPlayer]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    state,
    controls,
    videoRef,
    initPlayer,
    destroy,
  };
}
