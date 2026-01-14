/**
 * ScrubPreview Component
 *
 * Displays thumbnail previews when hovering over the seek bar.
 * Uses sprite sheets for efficient loading of preview thumbnails.
 *
 * Sprite Format:
 * - Each sprite is a grid image containing multiple thumbnails
 * - Thumbnails are arranged in cols × rows layout
 * - Multiple sprite images for longer videos (sprite_000.jpg, sprite_001.jpg, etc.)
 *
 * Usage:
 * ```tsx
 * <ScrubPreview
 *   spriteMeta={movieSpriteMeta}
 *   hoverTime={15.5}
 *   isVisible={isHovering}
 *   positionPercent={25}
 * />
 * ```
 */

import { useEffect, useRef, useState, useMemo } from "react";
import type { ScrubPreviewProps, SpriteMeta } from "../types/player";

/**
 * Calculate which sprite image and thumbnail position to use for a given time.
 */
function calculateSpritePosition(
  timeInSeconds: number,
  meta: SpriteMeta
): { spriteIndex: number; col: number; row: number; spriteUrl: string } {
  const { spriteBaseUrl, cols, rows, intervalSeconds } = meta;

  // Calculate which thumbnail index this time corresponds to
  const thumbIndex = Math.floor(timeInSeconds / intervalSeconds);

  // Calculate how many thumbnails per sprite
  const thumbsPerSprite = cols * rows;

  // Which sprite file contains this thumbnail
  const spriteIndex = Math.floor(thumbIndex / thumbsPerSprite);

  // Position within the sprite
  const indexInSprite = thumbIndex % thumbsPerSprite;
  const col = indexInSprite % cols;
  const row = Math.floor(indexInSprite / cols);

  // Build sprite URL (sprite_000.jpg, sprite_001.jpg, etc.)
  const paddedIndex = String(spriteIndex).padStart(3, "0");
  const spriteUrl = `${spriteBaseUrl}${paddedIndex}.jpg`;

  return { spriteIndex, col, row, spriteUrl };
}

/**
 * Hook to manage lazy-loading of sprite images
 */
function useSpriteLoader(spriteMeta: SpriteMeta) {
  const [loadedSprites, setLoadedSprites] = useState<Set<number>>(
    () => new Set()
  );
  const loadingSprites = useRef<Set<number>>(new Set());

  const loadSprite = (spriteIndex: number) => {
    // Already loaded or loading
    if (
      loadedSprites.has(spriteIndex) ||
      loadingSprites.current.has(spriteIndex)
    ) {
      return;
    }

    // Don't load beyond available sprites
    if (spriteIndex >= spriteMeta.spriteCount) {
      return;
    }

    loadingSprites.current.add(spriteIndex);

    const paddedIndex = String(spriteIndex).padStart(3, "0");
    const spriteUrl = `${spriteMeta.spriteBaseUrl}${paddedIndex}.jpg`;

    const img = new Image();
    img.onload = () => {
      loadingSprites.current.delete(spriteIndex);
      setLoadedSprites((prev) => new Set(prev).add(spriteIndex));
    };
    img.onerror = () => {
      loadingSprites.current.delete(spriteIndex);
      console.warn(`Failed to load sprite: ${spriteUrl}`);
    };
    img.src = spriteUrl;
  };

  // Preload first few sprites on mount
  useEffect(() => {
    // Load first 3 sprites proactively
    for (let i = 0; i < Math.min(3, spriteMeta.spriteCount); i++) {
      loadSprite(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spriteMeta.spriteBaseUrl]);

  return { loadedSprites, loadSprite };
}

/**
 * Format time for display (e.g., "1:23:45" or "23:45")
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

export function ScrubPreview({
  spriteMeta,
  hoverTime,
  isVisible,
  positionPercent,
  className = "",
}: ScrubPreviewProps) {
  const { loadedSprites, loadSprite } = useSpriteLoader(spriteMeta);

  // Calculate sprite position for current hover time
  const { spriteIndex, col, row, spriteUrl } = useMemo(
    () => calculateSpritePosition(hoverTime, spriteMeta),
    [hoverTime, spriteMeta]
  );

  // Trigger loading of this sprite if not loaded
  useEffect(() => {
    if (isVisible) {
      loadSprite(spriteIndex);
      // Also preload adjacent sprites for smoother scrubbing
      loadSprite(spriteIndex + 1);
      if (spriteIndex > 0) loadSprite(spriteIndex - 1);
    }
  }, [isVisible, spriteIndex, loadSprite]);

  const isLoaded = loadedSprites.has(spriteIndex);

  // Calculate background position
  const bgPosX = -(col * spriteMeta.thumbWidth);
  const bgPosY = -(row * spriteMeta.thumbHeight);

  // Clamp position so preview doesn't go off-screen
  // Assuming parent is full width, clamp between ~5% and ~95%
  const clampedPosition = Math.max(5, Math.min(95, positionPercent));

  if (!isVisible) return null;

  return (
    <div
      className={`absolute bottom-full mb-3 pointer-events-none ${className}`}
      style={{
        left: `${clampedPosition}%`,
        transform: "translateX(-50%)",
      }}
      // Purely decorative preview - hide from screen readers
      aria-hidden="true"
    >
      {/* Preview thumbnail */}
      <div
        className="rounded-md overflow-hidden border-2 border-primary/50 shadow-lg bg-secondary"
        style={{
          width: spriteMeta.thumbWidth,
          height: spriteMeta.thumbHeight,
        }}
      >
        {isLoaded ? (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${spriteUrl})`,
              backgroundPosition: `${bgPosX}px ${bgPosY}px`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${spriteMeta.cols * spriteMeta.thumbWidth}px ${
                spriteMeta.rows * spriteMeta.thumbHeight
              }px`,
            }}
          />
        ) : (
          // Loading placeholder
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Time label */}
      <div className="mt-1 text-center">
        <span className="px-2 py-0.5 rounded bg-black/80 text-xs font-medium text-white">
          {formatTime(hoverTime)}
        </span>
      </div>
    </div>
  );
}
