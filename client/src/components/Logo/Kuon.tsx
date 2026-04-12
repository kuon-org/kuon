// import Kuon from "../../assets/kuon.svg";

interface KuonLogoProps {
  size?: number;
  variant?: "default" | "light" | "accent";
}

export function KuonLogo({ size = 120, variant = "default" }: KuonLogoProps) {
  // ブランドカラー
  const KATSUIRO_DEEP = "#181B26";
  const KATSUIRO_MAIN = "#232736";
  const KATSUIRO_LIGHT = "#3B4252";
  const ACCENT_BLUE = "#5BB0E5";

  // バリエーションに応じた色を選択
  const colors = {
    default: {
      primary: KATSUIRO_MAIN,
      secondary: KATSUIRO_LIGHT,
      accent: ACCENT_BLUE,
    },
    light: {
      primary: KATSUIRO_LIGHT,
      secondary: ACCENT_BLUE,
      accent: ACCENT_BLUE,
    },
    accent: {
      primary: ACCENT_BLUE,
      secondary: ACCENT_BLUE,
      accent: KATSUIRO_LIGHT,
    },
  };

  const colorScheme = colors[variant];

  return (
    // <img src={Kuon} width="32px" />
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 背景円（オプション） */}
      <rect
        x="2"
        y="2"
        width="116"
        height="116"
        rx="24"
        fill={KATSUIRO_DEEP}
        opacity="0.4"
      />

      {/* Kの縦棒（ペン） */}
      <g>
        {/* ペンの本体 - よりクラシックな万年筆風 */}
        <path d="M 44 25 H 51 V 92 H 44 Z" fill={colorScheme.primary} />
        {/* ペン先 - シンプルな三角形 */}
        <path d="M 44 92 L 47.5 98 L 51 92 Z" fill={colorScheme.primary} />
        {/* ペン先の中央ライン */}
        <line
          x1="47.5"
          y1="92"
          x2="47.5"
          y2="97.5"
          stroke={colorScheme.accent}
          strokeWidth="0.5"
        />
        {/* ペンキャップの境界線 */}
        <rect
          x="44"
          y="30"
          width="7"
          height="1"
          fill={colorScheme.accent}
          opacity="0.6"
        />
      </g>

      {/* 上の角度部分（本のページ - 上）- より閉じた角度 */}
      <g>
        {/* 一番奥のページ */}
        <path
          d="M 45.9 62.4 L 79.9 27.3 L 82.9 29.9 L 48.9 65 Z"
          fill={colorScheme.secondary}
          opacity="0.5"
        />
        {/* 中間のページ */}
        <path
          d="M 46.1 61 L 78.1 25.9 L 81.1 28.5 L 49.1 63.6 Z"
          fill={colorScheme.secondary}
          opacity="0.7"
        />
        {/* 一番手前のページ */}
        <path
          d="M 45.9 59.7 L 75.9 24.6 L 78.9 27.2 L 48.9 62.3 Z"
          fill={colorScheme.primary}
        />
        {/* ページのエッジ（厚み） */}
        <path
          d="M 75.7 24.6 L 78.7 27.2 L 78.7 28.5 L 75.7 25.9 Z"
          fill={colorScheme.accent}
        />
      </g>

      {/* 下の角度部分（本のページ - 下）- より閉じた角度 */}
      <g>
        {/* 一番奥のページ */}
        <path
          d="M 52.6 53.9 L 83.2 93.9 L 85.9 92.9 L 55.3 51.9 Z"
          fill={colorScheme.secondary}
          opacity="0.5"
        />
        {/* 中間のページ */}
        <path
          d="M 52.6 54.9 L 81.4 94.9 L 84.1 93.9 L 55.3 52.9 Z"
          fill={colorScheme.secondary}
          opacity="0.7"
        />
        {/* 一番手前のページ */}
        <path
          d="M 52.5 55.9 L 79.5 95.9 L 82.2 94.9 L 55.2 53.9 Z"
          fill={colorScheme.primary}
        />
        {/* ページのエッジ（厚み） */}
        <path
          d="M 79.7 96.9 L 82.4 94.9 L 82.4 93.9 L 79.7 95.9 Z"
          fill={colorScheme.accent}
        />
      </g>
    </svg>
  );
}
