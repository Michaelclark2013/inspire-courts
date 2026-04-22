import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Series,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { BRAND, FONT_DISPLAY } from "../brand";
import { Chevron } from "../components/Chevron";

const CLIPS = [
  {
    src: "https://assets.mixkit.co/videos/744/744-1080.mp4",
    label: "7 COURTS",
    sub: "one roof · zero excuses",
  },
  {
    src: "https://assets.mixkit.co/videos/12321/12321-720.mp4",
    label: "HOOPS + VOLLEY",
    sub: "two sports · full speed",
  },
  {
    src: "https://assets.mixkit.co/videos/2273/2273-1080.mp4",
    label: "GAME FILM",
    sub: "every tournament · every court",
  },
];

const ClipCard: React.FC<{
  src: string;
  label: string;
  sub: string;
  index: number;
}> = ({ src, label, sub, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 60], [1.15, 1.35], {
    easing: Easing.out(Easing.quad),
  });

  const labelPop = spring({
    frame: frame - 6,
    fps,
    config: { damping: 14, stiffness: 220 },
    from: 0,
    to: 1,
  });
  const labelX = interpolate(labelPop, [0, 1], [-700, 0]);
  const labelOpacity = interpolate(frame, [6, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subY = interpolate(frame, [18, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitWipe = interpolate(frame, [52, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fit font to wide labels
  const labelSize = label.length > 10 ? 140 : 200;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
      </AbsoluteFill>

      {/* Vignette + red tint */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 30% 80%, rgba(204,0,0,0.2) 0%, transparent 60%)",
        }}
      />

      {/* Top pill */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 60,
          padding: "14px 28px",
          background: BRAND.red,
          color: "white",
          fontFamily: FONT_DISPLAY,
          fontSize: 36,
          letterSpacing: 4,
          transform: `translateX(${interpolate(frame, [0, 12], [-200, 0], { extrapolateRight: "clamp" })}px)`,
          clipPath:
            "polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)",
        }}
      >
        0{index + 1} / 03
      </div>

      {/* Top-right chevron */}
      <div
        style={{
          position: "absolute",
          top: 110,
          right: 60,
          transform: `rotate(${interpolate(frame, [0, 60], [-10, 10])}deg)`,
        }}
      >
        <Chevron size={120} />
      </div>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 380,
          left: 60,
          right: 60,
          transform: `translateX(${labelX}px)`,
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            color: "white",
            fontFamily: FONT_DISPLAY,
            fontSize: labelSize,
            lineHeight: 0.9,
            letterSpacing: -4,
            fontWeight: 900,
            textShadow: "0 6px 30px rgba(0,0,0,0.85)",
          }}
        >
          {label}.
        </div>
        <div
          style={{
            marginTop: 18,
            color: BRAND.red,
            fontFamily: FONT_DISPLAY,
            fontSize: 44,
            letterSpacing: 6,
            textTransform: "uppercase",
            transform: `translateY(${subY}px)`,
            opacity: subOpacity,
          }}
        >
          {sub}
        </div>
      </div>

      {/* Red exit wipe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: BRAND.red,
          transform: `translateX(${(1 - exitWipe) * 120}%) skewX(-18deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const FeatureMontage: React.FC = () => {
  return (
    <Series>
      {CLIPS.map((clip, i) => (
        <Series.Sequence key={clip.label} durationInFrames={60}>
          <ClipCard {...clip} index={i} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
