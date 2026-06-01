"use client";

interface Props {
  height?: number;
  style?: React.CSSProperties;
}

export default function NologinLogo({ height = 26, style }: Props) {
  return (
    <img
      src="/nologin-logo-dark.png"
      alt="NoLogin"
      style={{ height, objectFit: "contain", flexShrink: 0, display: "block", ...style }}
    />
  );
}
