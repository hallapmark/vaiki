/**
 * useScrubPreview Hook
 *
 * Manages the state for scrub preview thumbnails on a seek bar.
 */

import { useState } from "react";
import type { SpriteMeta } from "../types/player";

export interface ScrubPreviewHoverState {
  isHovering: boolean;
  hoverTime: number;
  positionPercent: number;
}

/**
 * Hook for managing scrub preview hover state
 *
 * Usage:
 * ```tsx
 * const { hoverState, handleSeekBarHover, handleSeekBarLeave } = useScrubPreview(
 *   spriteMeta,
 *   duration
 * );
 * ```
 */
export function useScrubPreview(
  spriteMeta: SpriteMeta | null | undefined,
  duration: number
) {
  const [hoverState, setHoverState] = useState<ScrubPreviewHoverState>({
    isHovering: false,
    hoverTime: 0,
    positionPercent: 0,
  });

  const handleSeekBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spriteMeta || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const time = (percent / 100) * duration;

    setHoverState({
      isHovering: true,
      hoverTime: Math.max(0, Math.min(duration, time)),
      positionPercent: percent,
    });
  };

  const handleSeekBarLeave = () => {
    setHoverState((prev) => ({ ...prev, isHovering: false }));
  };

  return {
    hoverState,
    handleSeekBarHover,
    handleSeekBarLeave,
  };
}
