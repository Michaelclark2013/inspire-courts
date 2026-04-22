import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { BRAND, FONT_DISPLAY } from "../brand";
import { Chevron } from "../components/Chevron";

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sweep = interpolate(frame, [0, 120], [0, 100]);

  const urlSpring = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 130 },
    from: 0,
    to: 1,
  });
  const urlScale = interpolate(urlSpring, [0, 1], [2.2, 1]);
  const urlOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pillDelay = 18;
  const pills = ["HOOPS", "VOLLEY", "TOURNAMENTS", "BOOK A COURT"];

  const pulse = 1 + Math.sin(frame * 0.18) * 0.015;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BRAND.bg} 0%, ${BRAND.bgNavy} 50%, #1a0000 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -200,
          background:
            "linear-gradient(120deg, transparent 0%, transparent 40%, rgba(204,0,0,0.1) 50%, transparent 60%, transparent 100%)",
          transform: `translateX(${sweep - 50}%)`,
        }}
      />

      {/* Floating chevrons */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = interpolate(
          (frame + i * 30) % 150,
          [0, 150],
          [2000, -200]
        );
        const x = (i * 217) % 1080;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              opacity: 0.3,
            }}
          >
            <Chevron size={60 + i * 8} />
          </div>
        );
      })}

      <div
        style={{
          position: "relative",
          textAlign: "center",
          transform: `scale(${pulse})`,
        }}
      >
        <div
          style={{
            color: BRAND.red,
            fontFamily: FONT_DISPLAY,
            fontSize: 42,
            letterSpacing: 10,
            marginBottom: 22,
            opacity: urlOpacity,
          }}
        >
          ▸ BOOK · PLAY · COMPETE
        </div>
        <div
          style={{
            transform: `scale(${urlScale})`,
            opacity: urlOpacity,
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 110,
            lineHeight: 0.95,
            letterSpacing: -3,
            fontWeight: 900,
            textShadow: `0 0 50px rgba(204,0,0,0.5)`,
          }}
        >
          INSPIRE
          <br />
          COURTS<span style={{ color: BRAND.red }}>AZ</span>
          <br />
          <span style={{ fontSize: 80, color: BRAND.red }}>.COM</span>
        </div>

        <div
          style={{
            marginTop: 44,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          {pills.map((p, i) => {
            const delay = pillDelay + i * 6;
            const a = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 200 },
              from: 0,
              to: 1,
            });
            return (
              <div
                key={p}
                style={{
                  padding: "14px 26px",
                  border: `2px solid ${BRAND.red}`,
                  color: BRAND.red,
                  fontFamily: FONT_DISPLAY,
                  fontSize: 30,
                  letterSpacing: 4,
                  transform: `translateY(${(1 - a) * 40}px) scale(${a})`,
                  opacity: a,
                }}
              >
                {p}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 40,
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: 34,
            letterSpacing: 6,
            opacity: interpolate(frame, [70, 85], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          (480) 221-7218
        </div>
      </div>

      {/* Corner marks */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          color: BRAND.muted,
          fontFamily: FONT_DISPLAY,
          fontSize: 24,
          letterSpacing: 3,
        }}
      >
        <span>GILBERT, AZ</span>
        <span>▸ 7 COURTS OPEN</span>
      </div>
    </AbsoluteFill>
  );
};
