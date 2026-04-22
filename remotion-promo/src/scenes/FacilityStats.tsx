import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { BRAND, FONT_DISPLAY } from "../brand";
import { Chevron } from "../components/Chevron";

const STATS = [
  { value: "7", label: "REGULATION COURTS", sub: "basketball + volleyball" },
  { value: "365", label: "DAYS OF HOOPS", sub: "indoor · climate controlled" },
  { value: "100%", label: "GAME FILM", sub: "every court · every tournament" },
];

export const FacilityStats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 180], [1.1, 1.22]);

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 130 },
    from: 0,
    to: 1,
  });
  const titleY = interpolate(titleSpring, [0, 1], [80, 0]);
  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src="https://assets.mixkit.co/videos/44448/44448-1080.mp4"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.35) saturate(0.9) contrast(1.1)",
          }}
          muted
        />
      </AbsoluteFill>

      {/* Navy wash */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${BRAND.bgNavy}cc 0%, ${BRAND.bg}33 40%, ${BRAND.bg}ee 100%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 170,
          left: 60,
          right: 60,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 22px",
            background: BRAND.red,
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          <div style={{ width: 10, height: 10, background: "white", borderRadius: 5 }} />
          GILBERT · ARIZONA
        </div>
        <div
          style={{
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 140,
            lineHeight: 0.88,
            letterSpacing: -5,
            fontWeight: 900,
          }}
        >
          ARIZONA'S
          <br />
          <span style={{ color: BRAND.red }}>PREMIER.</span>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {STATS.map((s, i) => {
          const a = spring({
            frame: frame - 25 - i * 16,
            fps,
            config: { damping: 15, stiffness: 150 },
            from: 0,
            to: 1,
          });
          const x = interpolate(a, [0, 1], [900, 0]);
          const opacity = interpolate(a, [0, 0.3, 1], [0, 0.5, 1]);
          return (
            <div
              key={s.label}
              style={{
                transform: `translateX(${x}px)`,
                opacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "26px 32px",
                background: "rgba(11,29,58,0.72)",
                backdropFilter: "blur(8px)",
                border: `1px solid rgba(204,0,0,0.45)`,
                borderLeft: `6px solid ${BRAND.red}`,
              }}
            >
              <div
                style={{
                  color: BRAND.red,
                  fontFamily: FONT_DISPLAY,
                  fontSize: 120,
                  lineHeight: 1,
                  minWidth: 180,
                  textAlign: "center",
                }}
              >
                {s.value}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "white",
                    fontFamily: FONT_DISPLAY,
                    fontSize: 48,
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    color: BRAND.muted,
                    fontFamily:
                      "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 24,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {s.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accent chevron */}
      <div
        style={{
          position: "absolute",
          top: 140,
          right: 60,
          transform: `rotate(${interpolate(frame, [0, 180], [-8, 8])}deg) scale(${interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" })})`,
        }}
      >
        <Chevron size={120} />
      </div>
    </AbsoluteFill>
  );
};
