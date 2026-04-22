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

const TOURNAMENTS = [
  "OFF SZN HOOPS",
  "AAU SHOWDOWN",
  "ELITE SPRING TIP-OFF",
  "DESERT CUP",
  "PREP SHOWCASE",
  "VOLLEY WEEKEND",
  "CLUB NATIONALS",
];

export const TournamentTicker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ["TOURNAMENTS", "EVERY", "WEEKEND."];
  const zoom = interpolate(frame, [0, 180], [1.05, 1.18]);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src="https://assets.mixkit.co/videos/13733/13733-720.mp4"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.3) contrast(1.1) saturate(0.7) hue-rotate(-20deg)",
          }}
          muted
        />
      </AbsoluteFill>

      {/* Red wash */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(204,0,0,0.22) 0%, rgba(5,5,5,0) 60%)",
        }}
      />

      {/* Top ticker */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          overflow: "hidden",
          height: 70,
          borderTop: `2px solid ${BRAND.red}`,
          borderBottom: `2px solid ${BRAND.red}`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 80,
            whiteSpace: "nowrap",
            transform: `translateX(${-frame * 6}px)`,
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 42,
            letterSpacing: 6,
          }}
        >
          {[...TOURNAMENTS, ...TOURNAMENTS, ...TOURNAMENTS].map((t, i) => (
            <span key={i}>
              {t} <span style={{ color: BRAND.red }}>▸</span>
            </span>
          ))}
        </div>
      </div>

      {/* Stacked headline */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: "38%",
          transform: "translateY(-50%)",
        }}
      >
        {words.map((w, i) => {
          const a = spring({
            frame: frame - 8 - i * 10,
            fps,
            config: { damping: 14, stiffness: 200 },
            from: 0,
            to: 1,
          });
          const x = interpolate(a, [0, 1], [-800, 0]);
          const opacity = interpolate(a, [0, 0.4, 1], [0, 0.3, 1]);
          const isAccent = w === "WEEKEND.";
          const size = w.length > 9 ? 170 : 210;
          return (
            <div
              key={w + i}
              style={{
                transform: `translateX(${x}px)`,
                opacity,
                color: isAccent ? BRAND.red : "white",
                fontFamily: FONT_DISPLAY,
                fontSize: size,
                lineHeight: 0.85,
                letterSpacing: -6,
                fontWeight: 900,
                textShadow: "0 10px 40px rgba(0,0,0,0.9)",
              }}
            >
              {w}
            </div>
          );
        })}
      </div>

      {/* Bottom ticker (reversed) */}
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 0,
          right: 0,
          overflow: "hidden",
          height: 70,
          borderTop: `2px solid ${BRAND.red}`,
          borderBottom: `2px solid ${BRAND.red}`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 80,
            whiteSpace: "nowrap",
            transform: `translateX(${-3000 + frame * 6}px)`,
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 42,
            letterSpacing: 6,
          }}
        >
          {[...TOURNAMENTS, ...TOURNAMENTS, ...TOURNAMENTS].map((t, i) => (
            <span key={i}>
              {t} <span style={{ color: BRAND.red }}>▸</span>
            </span>
          ))}
        </div>
      </div>

      {/* Corner chevrons */}
      <div style={{ position: "absolute", top: 40, left: 40 }}>
        <Chevron size={80} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 40,
          transform: "rotate(180deg)",
        }}
      >
        <Chevron size={80} />
      </div>
    </AbsoluteFill>
  );
};
