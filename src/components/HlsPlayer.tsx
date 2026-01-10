import { useEffect, useRef, useState } from "react";
import Hls, { Level } from "hls.js";

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
        if (!video) return;

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

        // Safari native HLS
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
        } 
        // hls.js path
        else if (Hls.isSupported()) {
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
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [src]);

    const handleMouseMove = () => {
        triggerBadge();
    };

    return (
        <div
            className={`relative block ${className ?? ""}`}
            onMouseMove={handleMouseMove}
        >
            <video
                ref={videoRef}
                controls
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
        </div>
    );
};
