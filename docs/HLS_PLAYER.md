# HLS Player System

A comprehensive HLS video player implementation for the Vaiki streaming application.

## Overview

This player system provides:

- **HLS playback** with Safari native support and hls.js fallback for Chrome/Firefox
- **Adaptive bitrate streaming** with quality level selection
- **Scrub preview thumbnails** using sprite sheets
- **Hover preview** infrastructure for movie cards (API ready, playback deferred)
- **Custom controls** with keyboard navigation and accessibility

## Quick Start

1. **Play a movie** - Navigate to any movie detail page and click the play button
2. **Test stream** - Uses Big Buck Bunny HLS stream for development

```tsx
import { HlsPlayer } from "./components/HlsPlayer";

<HlsPlayer
  movieId="metropolis"
  posterUrl="/posters/metropolis.jpg"
  prebufferSeconds={2}
  onReady={() => console.log("Ready!")}
/>;
```

## Components

### HlsPlayer

The main video player component.

**Props:**

| Prop               | Type                   | Default  | Description                           |
| ------------------ | ---------------------- | -------- | ------------------------------------- |
| `movieId`          | `string`               | required | Movie ID passed to `getPlaybackUrl()` |
| `posterUrl`        | `string`               | -        | Poster shown before playback          |
| `preload`          | `boolean`              | `false`  | Preload manifest on mount             |
| `prebufferSeconds` | `number`               | `2`      | Buffer seconds before auto-play       |
| `onReady`          | `() => void`           | -        | Called when player is ready           |
| `onError`          | `(err: Error) => void` | -        | Called on playback error              |
| `className`        | `string`               | -        | Additional CSS classes                |
| `spriteMeta`       | `SpriteMeta`           | -        | Sprite metadata for scrub previews    |

**Keyboard Shortcuts:**

- `Space` / `K` - Play/Pause
- `←` / `→` - Seek ±5 seconds
- `↑` / `↓` - Volume ±10%
- `M` - Mute/Unmute
- `F` - Toggle fullscreen

### ScrubPreview

Displays thumbnail previews when hovering over the seek bar.

```tsx
import { ScrubPreview, useScrubPreview } from "./components/ScrubPreview";

const { hoverState, handleSeekBarHover, handleSeekBarLeave } = useScrubPreview(
  spriteMeta,
  duration
);

<ScrubPreview
  spriteMeta={spriteMeta}
  hoverTime={hoverState.hoverTime}
  isVisible={hoverState.isHovering}
  positionPercent={hoverState.positionPercent}
/>;
```

### HoverPreview

Provides hover preview functionality for movie cards (API ready).

```tsx
import { HoverPreview, useHoverPreviewState } from "./components/HoverPreview";

const { isHovering, handlers } = useHoverPreviewState();

<div {...handlers}>
  <MovieCard movie={movie} />
  <HoverPreview
    previewClipUrl="/previews/movie-clip.mp4"
    isActive={isHovering}
  />
</div>;
```

### usePlayback Hook

Abstracts player initialization and controls.

```tsx
import { usePlayback } from "./hooks/usePlayback";

const { state, controls, videoRef, initPlayer, destroy } = usePlayback({
  movieId: "metropolis",
  prebufferSeconds: 2,
  onReady: () => console.log("Ready"),
  onError: (err) => console.error(err),
});

// State
state.isPlaying; // boolean
state.currentTime; // number (seconds)
state.duration; // number (seconds)
state.qualityLevels; // QualityLevel[]

// Controls
controls.play();
controls.pause();
controls.seek(30);
controls.setQuality(1); // or -1 for auto
controls.toggleFullscreen();
```

## Configuration

### Changing Prebuffer Duration

The `prebufferSeconds` prop controls how long to buffer before starting playback:

```tsx
// Start faster with less buffer (may cause more rebuffering)
<HlsPlayer movieId="movie" prebufferSeconds={1} />

// More buffer for smoother playback
<HlsPlayer movieId="movie" prebufferSeconds={5} />
```

### HLS.js Configuration

Edit `src/hooks/usePlayback.ts` to tune hls.js settings:

```ts
const HLS_CONFIG: Partial<HlsConfig> = {
  maxBufferLength: 60, // Max buffer ahead (seconds)
  maxMaxBufferLength: 120, // Absolute max buffer
  maxBufferSize: 60_000_000, // 60MB buffer limit
  startFragPrefetch: false, // Prefetch first fragment
  // ... see hls.js docs for more options
};
```

## Integrating Real Playback URLs

### Current (Development)

The `getPlaybackUrl()` function in `src/data/movies.ts` returns test streams:

```ts
export function getPlaybackUrl(movieId: string): string {
  return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
}
```

### Production Integration

Replace with your backend API call:

```ts
export async function getPlaybackUrl(
  movieId: string,
  authToken?: string
): Promise<string> {
  const response = await fetch(`/api/movies/${movieId}/playback`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      // CloudFront signed cookie/header if needed
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get playback URL");
  }

  const data = await response.json();
  return data.url; // Signed CloudFront URL
}
```

Update the hook to handle async:

```ts
// In usePlayback.ts, change initPlayer to await the URL
const url = await getPlaybackUrl(movieId);
```

## Sprite Metadata

### Format

Sprites are grid images containing multiple thumbnails:

```ts
type SpriteMeta = {
  spriteBaseUrl: string; // "/sprites/movie/sprite_"
  spriteCount: number; // Number of sprite images
  thumbWidth: number; // Thumbnail width (px)
  thumbHeight: number; // Thumbnail height (px)
  cols: number; // Columns per sprite (e.g., 5)
  rows: number; // Rows per sprite (e.g., 5)
  intervalSeconds: number; // Seconds between thumbs (e.g., 15)
};
```

### Example

For a 2-hour movie with 15-second intervals:

- Total thumbnails: 480 (7200s ÷ 15s)
- With 5×5 sprites: 20 sprite files
- Files: `sprite_000.jpg`, `sprite_001.jpg`, ... `sprite_019.jpg`

### Generating Sprites

Use FFmpeg to generate sprite sheets:

```bash
# Extract thumbnails every 15 seconds
ffmpeg -i movie.mp4 -vf "fps=1/15,scale=160:90,tile=5x5" \
  -an sprites/sprite_%03d.jpg
```

## Hover Preview Implementation

The `HoverPreview` component provides the API for future implementation:

```tsx
// TODOs in HoverPreview.tsx:
// 1. Video clip playback - uncomment play() call
// 2. Sprite animation - implement frame cycling loop
```

### Video Clip Preview

```tsx
<HoverPreview
  previewClipUrl="/previews/movie-123-preview.mp4"
  isActive={isHovering}
/>
```

### Sprite Animation Preview

```tsx
<HoverPreview spriteMeta={movieSpriteMeta} isActive={isHovering} />
```

## Browser Support

| Browser | HLS Method | Notes                        |
| ------- | ---------- | ---------------------------- |
| Safari  | Native     | Uses `<video src="...m3u8">` |
| Chrome  | hls.js     | MSE-based playback           |
| Firefox | hls.js     | MSE-based playback           |
| Edge    | hls.js     | MSE-based playback           |

The player automatically detects and uses the appropriate method.

## Error Handling

The player displays user-friendly error messages with retry functionality:

```tsx
<HlsPlayer
  movieId="movie"
  onError={(err) => {
    // Log to your error tracking service
    console.error("Playback failed:", err);
  }}
/>
```

Error types:

- **Network errors**: Automatically attempts recovery
- **Media errors**: Attempts `hls.recoverMediaError()`
- **Fatal errors**: Shows retry button

## Accessibility

- Keyboard navigation for all controls
- ARIA labels on interactive elements
- Focus-visible indicators using yellow accent color
- Screen reader announcements for state changes
- Decorative elements marked `aria-hidden`

## File Structure

```
src/
├── components/
│   ├── HlsPlayer/
│   │   └── index.tsx      # Main player component
│   ├── ScrubPreview.tsx   # Seek bar thumbnails
│   └── HoverPreview.tsx   # Movie card previews
├── hooks/
│   └── usePlayback.ts     # Player state & controls
├── types/
│   └── player.ts          # TypeScript interfaces
└── data/
    └── movies.ts          # getPlaybackUrl() function
```
