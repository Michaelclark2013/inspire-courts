import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { BRAND, FONT_DISPLAY } from "../brand";
import { Chevron } from "../components/Chevron";

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Red streak rips across the frame
  const streakProgress = interpolate(frame, [0, 22], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const streakX = interpolate(streakProgress, [0, 1], [-1200, 1200]);
  const streakOpacity = interpolate(frame, [2, 10, 22, 28], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chevron thrust
  const chevronScale = interpolate(frame, [0, 14, 24], [0.4, 1.6, 1.0], {
    extrapolateRight: "clamp",
  });
  const chevronX = interpolate(frame, [0, 22], [-800, 0]);

  // Flash
  const flash = interpolate(frame, [20, 24, 32], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // INSPIRE wordmark
  const textStart = 28;
  const textScale = spring({
    frame: frame - textStart,
    fps,
    config: { damping: 14, stiffness: 180 },
    from: 0.7,
    to: 1,
  });
  const textOpacity = interpolate(frame, [textStart, textStart + 5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const breathe = interpolate(frame, [textStart + 5, 75], [1, 1.04]);

  // Sub "ARIZONA" line
  const subOpacity = interpolate(frame, [textStart + 8, textStart + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [textStart + 8, textStart + 18], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgNavy} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Red streak */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: "100%",
          height: 12,
          background: `linear-gradient(90deg, transparent 0%, ${BRAND.red} 45%, #fff 50%, ${BRAND.red} 55%, transparent 100%)`,
          transform: `translate(${streakX}px, -6px) skewX(-18deg)`,
          opacity: streakOpacity,
          filter: "blur(3px)",
          boxShadow: `0 0 60px ${BRAND.red}, 0 0 120px ${BRAND.red}`,
        }}
      />

      {/* Chevron */}
      <div
        style={{
          position: "absolute",
          transform: `translateX(${chevronX}px) scale(${chevronScale})`,
          opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Chevron size={400} color={BRAND.red} />
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

      {/* INSPIRE wordmark */}
      <div
        style={{
          position: "relative",
          transform: `scale(${textScale * breathe})`,
          opacity: textOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 210,
            lineHeight: 0.85,
            letterSpacing: -6,
            fontWeight: 900,
            textShadow: `0 0 40px rgba(204,0,0,0.6)`,
          }}
        >
          INSPIRE
        </div>
        <div
          style={{
            marginTop: -10,
            color: BRAND.red,
            fontFamily: FONT_DISPLAY,
            fontSize: 210,
            lineHeight: 0.85,
            letterSpacing: -4,
            fontWeight: 900,
          }}
        >
          COURTS
        </div>
        <div
          style={{
            marginTop: 24,
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 40,
            letterSpacing: 18,
            transform: `translateY(${subY}px)`,
            opacity: subOpacity,
          }}
        >
          · GILBERT · ARIZONA ·
        </div>
      </div>
    </AbsoluteFill>
  );
};
