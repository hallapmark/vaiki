/**
 * useHoverPreview Hook
 *
 * Manages hover preview state for movie cards.
 */

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Hook for managing hover preview state on movie cards
 *
 * Usage:
 * ```tsx
 * const { isHovering, handlers } = useHoverPreviewState();
 *
 * <div {...handlers}>
 *   <MovieCard />
 *   <HoverPreview isActive={isHovering} ... />
 * </div>
 * ```
 */
export function useHoverPreviewState(hoverDelay = 500) {
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      setIsHovering(true);
    }, hoverDelay);
  }, [hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovering(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isHovering,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
