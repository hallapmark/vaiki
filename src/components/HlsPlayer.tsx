import { useEffect, useRef, useState } from "react";
import Hls, { Level } from "hls.js";
import { Play, Pause } from "lucide-react";

export interface HlsPlayerProps {
  src: string;
  className?: string;
}

export const HlsPlayer = ({ src, className }: HlsPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<number | null>(null);

  const [qualityLabel, setQualityLabel] = useState<string>("");
  const [showBadge, setShowBadge] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback & pointer state for overlay and cursor hiding
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPointerInside, setIsPointerInside] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const moveTimer = useRef<number | null>(null);

  const lastLabelRef = useRef<string>("");

  const triggerBadge = () => {
    setShowBadge(true);
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
    }
    hideTimer.current = window.setTimeout(() => {
      setShowBadge(false);
    }, 2000);
  };

  useEffect(() => {
    const video = videoRef.current;

    // Reset any previous error state
    setErrorMessage(null);

    if (!video) return;

    // Validate src and browser support for hls.js. We intentionally do not
    // fallback to native HLS — if hls.js isn't available, show a message.
    if (!src) {
      setErrorMessage("No playback URL configured for this content.");
      return;
    }

    if (!Hls.isSupported()) {
      setErrorMessage(
        "Playback not supported on this browser."
      );
      return;
    }

    lastLabelRef.current = "";

    const updateQuality = (height: number) => {
      let label = "";
      if (height >= 1080) label = "HD (1080p)";
      else if (height >= 720) label = "HD (720p)";
      else if (height >= 480) label = "SD (480p)";
      else if (height > 0) label = `${height}p`;

      if (label && label !== lastLabelRef.current) {
        lastLabelRef.current = label;
        setQualityLabel(label);
        triggerBadge();
      }
    };

    const handleVideoResize = () => {
      if (video.videoHeight > 0) {
        updateQuality(video.videoHeight);
      }
    };

    video.addEventListener("resize", handleVideoResize);
    video.addEventListener("loadedmetadata", handleVideoResize);

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level: Level | undefined = hls.levels[data.level];
        if (level && level.height) {
          updateQuality(level.height);
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Try to get initial quality from currentLevel if it's already set
        if (hls.currentLevel !== -1) {
          const level = hls.levels[hls.currentLevel];
          if (level && level.height) updateQuality(level.height);
        }
      });
    }

    return () => {
      video.removeEventListener("resize", handleVideoResize);
      video.removeEventListener("loadedmetadata", handleVideoResize);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (moveTimer.current) {
        window.clearTimeout(moveTimer.current);
        moveTimer.current = null;
      }
    };
  }, [src]);

  const handleMouseMove = () => {
    triggerBadge();

    setIsPointerInside(true);
    setIsMoving(true);

    if (moveTimer.current) {
      window.clearTimeout(moveTimer.current);
    }

    moveTimer.current = window.setTimeout(() => {
      setIsMoving(false);
    }, 1500);
  };

  const handleMouseEnter = () => {
    setIsPointerInside(true);
    setIsMoving(true);
    if (moveTimer.current) {
      window.clearTimeout(moveTimer.current);
    }
    moveTimer.current = window.setTimeout(() => {
      setIsMoving(false);
    }, 1500);
  };

  const handleMouseLeave = () => {
    setIsPointerInside(false);
    setIsMoving(false);
    if (moveTimer.current) {
      window.clearTimeout(moveTimer.current);
      moveTimer.current = null;
    }
  };

  const hideCursor = isPlaying && !isMoving && isPointerInside;

  return (
    <div
      className={`relative block ${className ?? ""} ${
        hideCursor ? "cursor-none" : ""
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full h-full rounded-lg bg-black object-contain"
      />

      {qualityLabel && (
        <div
          className={`
            absolute top-3 right-3
            rounded-md px-2 py-1 text-sm font-medium
            bg-black/70 text-white
            transition-opacity duration-300
            ${showBadge ? "opacity-100" : "opacity-0"}
          `}
        >
          {qualityLabel}
        </div>
      )}

      {/* Central overlay: show when pointer is inside and (paused OR moving) */}
      {isPointerInside && !errorMessage && (!isPlaying || isMoving) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm pointer-events-none transition-opacity duration-200">
            {!isPlaying ? (
              <Play className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Pause className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            role="status"
            tabIndex={0}
            className="rounded-md bg-black/70 text-white px-4 py-2 text-sm text-center max-w-[80%]"
          >
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};
