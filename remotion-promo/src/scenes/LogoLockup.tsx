import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { BRAND, FONT_DISPLAY } from "../brand";
import { Chevron } from "../components/Chevron";

export const LogoLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 165], [1.2, 1.35]);

  const logoSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 10, stiffness: 90, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [2.4, 1]);
  const logoOpacity = interpolate(frame, [6, 18], [0, 1], {
    extrapolateRight: "clamp",
  });

  const strike = spring({
    frame: frame - 22,
    fps,
    config: { damping: 18, stiffness: 280 },
    from: 0,
    to: 1,
  });
  const strikeScale = interpolate(strike, [0, 1], [3, 1]);
  const strikeOpacity = interpolate(frame, [22, 30], [0, 0.8], {
    extrapolateRight: "clamp",
  });

  const flash = interpolate(frame, [28, 32, 44], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [44, 60], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [44, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src="https://assets.mixkit.co/videos/2280/2280-720.mp4"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.3) blur(2px) saturate(1.2)",
          }}
          muted
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 55%, ${BRAND.bgNavy}77 0%, ${BRAND.bg}f0 75%)`,
        }}
      />

      {/* Big chevron strike */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -62%) scale(${strikeScale}) rotate(${interpolate(
            strike,
            [0, 1],
            [-30, 0]
          )}deg)`,
          opacity: strikeOpacity,
        }}
      >
        <Chevron size={600} />
      </div>

      {/* Flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "white",
          opacity: flash,
        }}
      />

      {/* Logo (white version of Inspire Courts) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("inspire-logo.svg")}
          style={{
            width: 780,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            filter: "drop-shadow(0 0 40px rgba(204,0,0,0.7))",
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 240,
          left: 60,
          right: 60,
          textAlign: "center",
          color: "white",
          fontFamily: FONT_DISPLAY,
          fontSize: 46,
          letterSpacing: 4,
          lineHeight: 1.15,
          transform: `translateY(${taglineY}px)`,
          opacity: taglineOpacity,
        }}
      >
        ARIZONA'S PREMIER
        <br />
        <span style={{ color: BRAND.red }}>INDOOR FACILITY.</span>
      </div>
    </AbsoluteFill>
  );
};
