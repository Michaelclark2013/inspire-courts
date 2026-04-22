import React from "react";
import { BRAND } from "../brand";

export const Chevron: React.FC<{
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size = 120, color = BRAND.red, style }) => {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 100 70"
      style={{
        filter: `drop-shadow(0 0 ${size * 0.25}px ${color})`,
        ...style,
      }}
    >
      <path d="M 0 0 L 25 0 L 70 35 L 25 70 L 0 70 L 45 35 Z" fill={color} />
    </svg>
  );
};
