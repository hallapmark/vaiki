/**
 * HlsPlayer Component
 *
 * A robust HLS video player supporting:
 * - Safari native HLS playback
 * - hls.js for Chrome/Firefox with adaptive bitrate
 * - Custom controls with keyboard navigation
 * - Scrub preview thumbnails (when sprite metadata provided)
 * - Prebuffering before playback start
 *
 * Usage:
 * ```tsx
 * <HlsPlayer
 *   movieId="metropolis"
 *   posterUrl="/posters/metropolis.jpg"
 *   prebufferSeconds={3}
 *   onReady={() => console.log('Player ready')}
 * />
 * ```
 */

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  useImperativeHandle,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  Settings,
  Loader2,
  AlertCircle,
  Film,
} from "lucide-react";
import { usePlayback, type UsePlaybackReturn } from "../../hooks/usePlayback";
import { useScrubPreview } from "../../hooks/useScrubPreview";
import { ScrubPreview } from "../ScrubPreview";
import type { HlsPlayerProps, QualityLevel } from "../../types/player";

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format seconds to time string (e.g., "1:23:45" or "23:45")
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Get quality label with badge
 */
function getQualityBadge(height: number): { label: string; badge?: string } {
  if (height >= 1080) return { label: "1080p", badge: "HD" };
  if (height >= 720) return { label: "720p", badge: "HD" };
  if (height >= 480) return { label: "480p", badge: "SD" };
  if (height >= 360) return { label: "360p" };
  return { label: `${height}p` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ControlButtonProps {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}

function ControlButton({
  onClick,
  label,
  children,
  className = "",
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 
        transition-colors focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/80
        ${className}`}
    >
      {children}
    </button>
  );
}

interface QualitySelectorProps {
  levels: QualityLevel[];
  currentLevel: number;
  autoSelectedLevel: number;
  onSelect: (level: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function QualitySelector({
  levels,
  currentLevel,
  autoSelectedLevel,
  onSelect,
  isOpen,
  onToggle,
}: QualitySelectorProps) {
  // Debug: log quality levels
  console.log(
    "[QualitySelector] levels:",
    levels.length,
    "currentLevel:",
    currentLevel,
    "autoSelectedLevel:",
    autoSelectedLevel
  );

  // Get the auto-selected quality label for display
  const autoLevel = levels.find((l) => l.index === autoSelectedLevel);
  const autoQualityLabel = autoLevel
    ? getQualityBadge(autoLevel.height).label
    : "";

  // Get current display label for the button
  const getCurrentLabel = () => {
    if (currentLevel === -1) {
      return autoQualityLabel ? `Auto (${autoQualityLabel})` : "Auto";
    }
    const level = levels.find((l) => l.index === currentLevel);
    return level ? getQualityBadge(level.height).label : "Quality";
  };

  return (
    <div className="relative">
      {/* Quality button with current quality displayed */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Quality settings"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-white/90 
          hover:text-white hover:bg-white/10 transition-colors 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary 
          focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">{getCurrentLabel()}</span>
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 py-2 min-w-40 rounded-lg 
            bg-black/90 backdrop-blur-sm border border-white/10 shadow-xl"
          role="menu"
          aria-label="Video quality"
        >
          {levels.length === 0 ? (
            // Safari native HLS - no quality control available
            <div className="px-4 py-2 text-sm text-white/60">
              Auto quality
              <p className="text-xs text-white/40 mt-1">
                Quality selection not available
              </p>
            </div>
          ) : (
            <>
              {/* Auto option */}
              <button
                type="button"
                onClick={() => onSelect(-1)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10
                  flex items-center justify-between
                  ${
                    currentLevel === -1
                      ? "text-primary font-medium"
                      : "text-white/80"
                  }`}
                role="menuitem"
              >
                <span>Auto</span>
                {autoQualityLabel && currentLevel === -1 && (
                  <span className="text-white/50 text-xs">
                    ({autoQualityLabel})
                  </span>
                )}
              </button>

              {/* Quality levels - sorted by height descending */}
              {[...levels]
                .sort((a, b) => b.height - a.height)
                .map((level) => {
                  const { label, badge } = getQualityBadge(level.height);
                  return (
                    <button
                      key={level.index}
                      type="button"
                      onClick={() => onSelect(level.index)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10
                      flex items-center gap-2
                      ${
                        currentLevel === level.index
                          ? "text-primary font-medium"
                          : "text-white/80"
                      }`}
                      role="menuitem"
                    >
                      <span>{label}</span>
                      {badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground">
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface SeekBarProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  onSeek: (time: number) => void;
  scrubPreviewElement?: React.ReactNode;
  onHover?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLeave?: () => void;
}

function SeekBar({
  currentTime,
  duration,
  bufferedEnd,
  onSeek,
  scrubPreviewElement,
  onHover,
  onLeave,
}: SeekBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || !duration) return;
    const rect = barRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      onSeek(Math.max(0, currentTime - 5));
    } else if (e.key === "ArrowRight") {
      onSeek(Math.min(duration, currentTime + 5));
    }
  };

  return (
    <div className="relative group flex-1">
      {/* Scrub preview - positioned above the bar */}
      {scrubPreviewElement}

      <div
        ref={barRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        className="relative h-1 bg-white/20 rounded-full cursor-pointer group-hover:h-1.5 transition-all"
        onClick={handleClick}
        onMouseMove={onHover}
        onMouseLeave={onLeave}
        onKeyDown={handleKeyDown}
      >
        {/* Buffered progress - more prominent */}
        <div
          className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Current progress */}
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full 
            shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export interface HlsPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setQuality: (level: number) => void;
  getPlayback: () => UsePlaybackReturn;
}

export function HlsPlayer({
  movieId,
  posterUrl,
  preload = false,
  prebufferSeconds = 2.5,
  onReady,
  onError,
  className = "",
  spriteMeta,
  ref,
}: HlsPlayerProps & { ref?: React.Ref<HlsPlayerHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  // Initialize playback hook
  const playback = usePlayback({
    movieId,
    prebufferSeconds,
    preload,
    onReady: () => {
      setHasStarted(true);
      onReady?.();
    },
    onError,
  });

  const { state, controls, videoRef } = playback;

  // Scrub preview hook
  const { hoverState, handleSeekBarHover, handleSeekBarLeave } =
    useScrubPreview(spriteMeta, state.duration);

  // Expose controls via ref
  useImperativeHandle(
    ref,
    () => ({
      play: controls.play,
      pause: controls.pause,
      seek: controls.seek,
      setQuality: controls.setQuality,
      getPlayback: () => playback,
    }),
    [controls, playback]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Control Visibility Management
  // ─────────────────────────────────────────────────────────────────────────

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = window.setTimeout(() => {
      if (state.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [state.isPlaying]);

  const handleMouseMove = useCallback(() => {
    if (hasStarted) {
      showControlsTemporarily();
    }
  }, [hasStarted, showControlsTemporarily]);

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard Controls
  // ─────────────────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          controls.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          controls.seekRelative(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          controls.seekRelative(5);
          break;
        case "ArrowUp":
          e.preventDefault();
          controls.setVolume(state.volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          controls.setVolume(state.volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          controls.toggleMute();
          break;
        case "f":
          e.preventDefault();
          void controls.toggleFullscreen();
          break;
        case "Escape":
          if (showQualityMenu) {
            setShowQualityMenu(false);
          }
          break;
      }
      showControlsTemporarily();
    },
    [controls, state.volume, showQualityMenu, showControlsTemporarily]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Play Button Click (Initial Start)
  // ─────────────────────────────────────────────────────────────────────────

  const handlePlayClick = useCallback(() => {
    if (!hasStarted) {
      void controls.play();
    } else {
      controls.togglePlay();
    }
    showControlsTemporarily();
  }, [hasStarted, controls, showControlsTemporarily]);

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Close quality menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showQualityMenu) {
        setShowQualityMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showQualityMenu]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden aspect-video group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (state.isPlaying) setShowControls(false);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Video player"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={!hasStarted ? posterUrl : undefined}
        playsInline
        onClick={handlePlayClick}
      />

      {/* Initial Play Overlay (before playback starts) */}
      {!hasStarted && !state.isError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={!state.isLoading ? handlePlayClick : undefined}
        >
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10">
            {state.isLoading ? (
              // Loading state with Film icon that fills based on actual readiness
              (() => {
                // Use prebufferProgress directly from state - it's calculated
                // using the same logic as hasEnoughBuffer()
                const progressPercent = Math.round(
                  state.prebufferProgress * 100
                );

                return (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      {/* Background circle */}
                      <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm" />

                      {/* Film icon with actual progress fill */}
                      <div className="relative">
                        {/* Base icon (gray) */}
                        <Film
                          className="w-10 h-10 text-white/30"
                          strokeWidth={1.5}
                        />
                        {/* Overlay icon (primary) clipped by actual buffer progress */}
                        <div
                          className="absolute inset-0 overflow-hidden transition-all duration-300"
                          style={{
                            clipPath: `inset(${100 - progressPercent}% 0 0 0)`,
                          }}
                        >
                          <Film
                            className="w-10 h-10 text-primary"
                            strokeWidth={1.5}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Ready to play state
              <div
                className="flex items-center justify-center w-20 h-20 rounded-full 
                    bg-primary/90 backdrop-blur-sm shadow-2xl
                    hover:bg-primary hover:scale-105 transition-all duration-200"
              >
                <Play
                  className="w-10 h-10 text-primary-foreground"
                  fill="currentColor"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {(state.isLoading || state.isBuffering) && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        </div>
      )}

      {/* Error State */}
      {state.isError && state.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-white text-center mb-4 max-w-md">
            {state.error.message}
          </p>
          <button
            type="button"
            onClick={controls.retry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground
                font-medium hover:bg-primary/90 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Player Controls */}
      {hasStarted && !state.isError && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 
              bg-linear-to-t from-black/80 via-black/40 to-transparent
              transition-opacity duration-300
              ${
                showControls || !state.isPlaying
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
        >
          {/* Seek Bar */}
          <div className="mb-3">
            <SeekBar
              currentTime={state.currentTime}
              duration={state.duration}
              bufferedEnd={state.bufferedEnd}
              onSeek={controls.seek}
              onHover={handleSeekBarHover}
              onLeave={handleSeekBarLeave}
              scrubPreviewElement={
                spriteMeta && hoverState.isHovering ? (
                  <ScrubPreview
                    spriteMeta={spriteMeta}
                    hoverTime={hoverState.hoverTime}
                    isVisible={hoverState.isHovering}
                    positionPercent={hoverState.positionPercent}
                  />
                ) : undefined
              }
            />
          </div>

          {/* Control Bar */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <ControlButton
              onClick={controls.togglePlay}
              label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </ControlButton>

            {/* Volume */}
            <ControlButton
              onClick={controls.toggleMute}
              label={state.isMuted ? "Unmute" : "Mute"}
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </ControlButton>

            {/* Time Display */}
            <div className="text-white/80 text-sm font-mono ml-2">
              <span>{formatTime(state.currentTime)}</span>
              <span className="text-white/50 mx-1">/</span>
              <span>{formatTime(state.duration)}</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Quality Selector */}
            <div onClick={(e) => e.stopPropagation()}>
              <QualitySelector
                levels={state.qualityLevels}
                currentLevel={state.currentQuality}
                autoSelectedLevel={state.autoSelectedLevel}
                onSelect={(level) => {
                  controls.setQuality(level);
                  setShowQualityMenu(false);
                }}
                isOpen={showQualityMenu}
                onToggle={() => setShowQualityMenu(!showQualityMenu)}
              />
            </div>

            {/* Fullscreen */}
            <ControlButton
              onClick={() => void controls.toggleFullscreen()}
              label={state.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {state.isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </ControlButton>
          </div>
        </div>
      )}

      {/* Current Quality Badge (shows briefly on quality change) */}
      {hasStarted &&
        state.qualityLevels.length > 0 &&
        state.currentQuality >= 0 && (
          <QualityBadge level={state.qualityLevels[state.currentQuality]} />
        )}
    </div>
  );
}

/**
 * Quality badge that shows briefly when quality changes
 */
function QualityBadge({ level }: { level?: QualityLevel }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const prevLevelRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (level && level.height !== prevLevelRef.current) {
      prevLevelRef.current = level.height;
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setVisible(false), 2000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [level]);

  if (!level || !visible) return null;

  const { label, badge } = getQualityBadge(level.height);

  return (
    <div
      className={`absolute top-4 right-4 px-2.5 py-1 rounded-md 
        bg-black/70 backdrop-blur-sm text-white text-sm font-medium
        flex items-center gap-1.5
        transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {badge && (
        <span className="px-1 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground">
          {badge}
        </span>
      )}
      <span>{label}</span>
    </div>
  );
}
