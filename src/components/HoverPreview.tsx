/**
 * HoverPreview Component
 *
 * Provides hover preview functionality for movie cards.
 * Supports two modes:
 *   1. Short video clip (MP4/WebM) - plays silently on hover
 *   2. Sprite-based animation - cycles through thumbnails
 *
 * Current Status: API and preloading implemented, playback deferred.
 *
 * Usage:
 * ```tsx
 * <HoverPreview
 *   previewClipUrl="/previews/movie-123-preview.mp4"
 *   isActive={isHovering}
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
import type { HoverPreviewProps, SpriteMeta } from "../types/player";

/**
 * Preview handle for external control
 */
export interface HoverPreviewHandle {
  playPreview: () => void;
  stopPreview: () => void;
  isPlaying: () => boolean;
}

/**
 * Hook for preloading preview assets
 */
function usePreviewPreloader(
  previewClipUrl?: string | null,
  spriteMeta?: SpriteMeta | null
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isClipLoaded, setIsClipLoaded] = useState(false);
  const [isSpriteLoaded, setIsSpriteLoaded] = useState(false);

  // Preload video clip
  useEffect(() => {
    if (!previewClipUrl) return;

    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    video.oncanplaythrough = () => {
      setIsClipLoaded(true);
    };

    video.onerror = () => {
      console.warn("Failed to preload preview clip:", previewClipUrl);
    };

    video.src = previewClipUrl;
    videoRef.current = video;

    return () => {
      video.src = "";
      videoRef.current = null;
    };
  }, [previewClipUrl]);

  // Preload first sprite sheet
  useEffect(() => {
    if (!spriteMeta || spriteMeta.spriteCount === 0) return;

    const spriteUrl = `${spriteMeta.spriteBaseUrl}000.jpg`;
    const img = new Image();

    img.onload = () => {
      setIsSpriteLoaded(true);
    };

    img.onerror = () => {
      console.warn("Failed to preload sprite:", spriteUrl);
    };

    img.src = spriteUrl;
  }, [spriteMeta]);

  return {
    preloadedVideo: videoRef,
    isClipLoaded,
    isSpriteLoaded,
  };
}

export function HoverPreview({
  previewClipUrl,
  spriteMeta,
  isActive,
  className = "",
  ref,
}: HoverPreviewProps & { ref?: React.Ref<HoverPreviewHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const spriteFrameRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Preload assets
  const { isClipLoaded, isSpriteLoaded } = usePreviewPreloader(
    previewClipUrl,
    spriteMeta
  );

  /**
   * Start playing the preview
   *
   * TODO: Implement actual playback logic
   * - For video clips: videoRef.current?.play()
   * - For sprites: Start animation loop cycling through frames
   */
  const playPreview = useCallback(() => {
    if (!isActive) return;

    // Video clip mode
    if (previewClipUrl && videoRef.current && isClipLoaded) {
      // TODO: Implement video playback
      // videoRef.current.currentTime = 0;
      // videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      console.log("[HoverPreview] TODO: Start video playback");
      return;
    }

    // Sprite animation mode
    if (spriteMeta && isSpriteLoaded) {
      // TODO: Implement sprite animation
      // Start a requestAnimationFrame loop that updates background-position
      // to cycle through sprite frames
      setIsPlaying(true);
      console.log("[HoverPreview] TODO: Start sprite animation");
      return;
    }
  }, [isActive, previewClipUrl, isClipLoaded, spriteMeta, isSpriteLoaded]);

  /**
   * Stop the preview
   */
  const stopPreview = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    spriteFrameRef.current = 0;
    setIsPlaying(false);
  }, []);

  // Expose controls via ref
  useImperativeHandle(
    ref,
    () => ({
      playPreview,
      stopPreview,
      isPlaying: () => isPlaying,
    }),
    [playPreview, stopPreview, isPlaying]
  );

  // Auto-play/stop based on isActive
  useEffect(() => {
    if (isActive) {
      // Small delay before starting preview for better UX
      const timer = setTimeout(playPreview, 300);
      return () => clearTimeout(timer);
    } else {
      stopPreview();
    }
  }, [isActive, playPreview, stopPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  // Don't render if no preview content
  if (!previewClipUrl && !spriteMeta) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Video clip preview (hidden until implemented) */}
      {previewClipUrl && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0"
          src={previewClipUrl}
          muted
          playsInline
          loop
          preload="auto"
          // TODO: Remove opacity-0 and implement actual playback
        />
      )}

      {/* Sprite animation preview (hidden until implemented) */}
      {spriteMeta && !previewClipUrl && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-0"
          style={{
            // TODO: Update background-image and background-position
            // in animation loop to cycle through sprite frames
            backgroundImage: isSpriteLoaded
              ? `url(${spriteMeta.spriteBaseUrl}000.jpg)`
              : "none",
          }}
        />
      )}

      {/* Loading indicator (shown while preloading) */}
      {isActive &&
        !isClipLoaded &&
        !isSpriteLoaded &&
        (previewClipUrl || spriteMeta) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
    </div>
  );
}
