/**
 * Apple splash screen meta tags for iOS PWA.
 * Without these, iOS shows a blank white screen during app launch.
 * Each tag targets a specific device resolution + scale factor.
 *
 * Since we can't generate real PNGs dynamically, we use a CSS-based approach:
 * a data URI SVG that matches the app's navy background with the logo.
 */

const NAVY = "#0B1D3A";

// Generate a simple SVG splash screen with the brand color
function splashSvg(w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${NAVY}"/>
    <text x="50%" y="48%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${Math.round(w * 0.06)}" font-weight="700" fill="white" letter-spacing="2">INSPIRE</text>
    <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${Math.round(w * 0.03)}" font-weight="400" fill="rgba(255,255,255,0.6)" letter-spacing="4">COURTS</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// iPhone & iPad resolutions (portrait)
const DEVICES = [
  // iPhone 15 Pro Max, 16 Plus
  { w: 1290, h: 2796, ratio: 3 },
  // iPhone 15 Pro, 16
  { w: 1179, h: 2556, ratio: 3 },
  // iPhone 15, 14 Pro
  { w: 1170, h: 2532, ratio: 3 },
  // iPhone 14 Plus, 13 Pro Max
  { w: 1284, h: 2778, ratio: 3 },
  // iPhone SE 3rd, 8
  { w: 750, h: 1334, ratio: 2 },
  // iPhone 12 mini, 13 mini
  { w: 1080, h: 2340, ratio: 3 },
  // iPad Pro 12.9"
  { w: 2048, h: 2732, ratio: 2 },
  // iPad Pro 11"
  { w: 1668, h: 2388, ratio: 2 },
  // iPad Air / 10th gen
  { w: 1640, h: 2360, ratio: 2 },
  // iPad mini 6th
  { w: 1488, h: 2266, ratio: 2 },
] as const;

export function AppleSplashScreens() {
  return (
    <>
      {DEVICES.map(({ w, h, ratio }) => (
        <link
          key={`${w}x${h}`}
          rel="apple-touch-startup-image"
          href={splashSvg(w, h)}
          media={`(device-width: ${w / ratio}px) and (device-height: ${h / ratio}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`}
        />
      ))}
    </>
  );
}
