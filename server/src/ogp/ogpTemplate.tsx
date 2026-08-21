import type { JSX } from "react";

export interface ArticleOgpProps {
  title: string;
  userName: string;
  avatarSrc?: string;
}

export const ArticleOgpTemplate = ({
  title,
  userName,
  avatarSrc,
}: ArticleOgpProps): JSX.Element => (
  <div
    style={{
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#3B4252",
      color: "white",
      padding: "64px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center" }}>
      <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
        <rect
          x="2"
          y="2"
          width="116"
          height="116"
          rx="24"
          fill="#181B26"
          opacity="0.4"
        />
        <path d="M 44 25 H 51 V 92 H 44 Z" fill="#5BB0E5" />
        <path d="M 44 92 L 47.5 98 L 51 92 Z" fill="#5BB0E5" />
        <line
          x1="47.5"
          y1="92"
          x2="47.5"
          y2="97.5"
          stroke="#5BB0E5"
          strokeWidth="0.5"
        />
        <path
          d="M 45.9 62.4 L 79.9 27.3 L 82.9 29.9 L 48.9 65 Z"
          fill="#3B4252"
          opacity="0.5"
        />
        <path
          d="M 46.1 61 L 78.1 25.9 L 81.1 28.5 L 49.1 63.6 Z"
          fill="#3B4252"
          opacity="0.7"
        />
        <path
          d="M 45.9 59.7 L 75.9 24.6 L 78.9 27.2 L 48.9 62.3 Z"
          fill="#5BB0E5"
        />
        <path
          d="M 75.7 24.6 L 78.7 27.2 L 78.7 28.5 L 75.7 25.9 Z"
          fill="#5BB0E5"
        />
        <path
          d="M 52.6 53.9 L 83.2 93.9 L 85.9 92.9 L 55.3 51.9 Z"
          fill="#5BB0E5"
          opacity="0.5"
        />
        <path
          d="M 52.6 54.9 L 81.4 94.9 L 84.1 93.9 L 55.3 52.9 Z"
          fill="#3B4252"
          opacity="0.7"
        />
        <path
          d="M 52.5 55.9 L 79.5 95.9 L 82.2 94.9 L 55.2 53.9 Z"
          fill="#5BB0E5"
        />
        <path
          d="M 79.7 96.9 L 82.4 94.9 L 82.4 93.9 L 79.7 95.9 Z"
          fill="#5BB0E5"
        />
      </svg>
      <div style={{ marginLeft: "20px", fontSize: "42px", fontWeight: 700 }}>
        Kuon
      </div>
    </div>

    <div
      style={{
        marginTop: "60px",
        fontSize: "58px",
        fontWeight: 700,
        lineHeight: 1.25,
      }}
    >
      {title}
    </div>

    <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
      {avatarSrc ? (
        <img
          src={avatarSrc}
          style={{
            backgroundColor: "#b0d7f0",
            borderRadius: "50%",
            width: "72px",
            height: "72px",
          }}
        />
      ) : (
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "#5BB0E5",
          }}
        />
      )}
      <div style={{ marginLeft: "20px", fontSize: "28px" }}>{userName}</div>
    </div>
  </div>
);
