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
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 背景円（オプション） */}
      <circle cx="60" cy="60" r="58" fill={KATSUIRO_DEEP} opacity="0.3" />

      {/* Kの縦棒（ペン） */}
      <g>
        {/* ペンの本体 - よりクラシックな万年筆風 */}
        <path
          d="M 44 25 L 51 25 L 51 92 L 44 92 Z"
          fill={colorScheme.primary}
        />
        {/* ペン先 - シンプルな三角形 */}
        <path d="M 44 92 L 47.5 98 L 51 92 Z" fill={colorScheme.primary} />
        {/* ペン先の中央ライン */}
        <line
          x1="47.5"
          y1="92"
          x2="47.5"
          y2="96"
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
          d="M 51 56 L 80 32 L 83 34 L 54 58 Z"
          fill={colorScheme.secondary}
          opacity="0.5"
        />
        {/* 中間のページ */}
        <path
          d="M 51 55 L 78 31 L 81 33 L 54 57 Z"
          fill={colorScheme.secondary}
          opacity="0.7"
        />
        {/* 一番手前のページ */}
        <path
          d="M 51 54 L 76 30 L 79 32 L 54 56 Z"
          fill={colorScheme.primary}
        />
        {/* ページのエッジ（厚み） */}
        <path d="M 76 30 L 79 32 L 79 33 L 76 31 Z" fill={colorScheme.accent} />
      </g>

      {/* 下の角度部分（本のページ - 下）- より閉じた角度 */}
      <g>
        {/* 一番奥のページ */}
        <path
          d="M 51 64 L 80 88 L 83 86 L 54 62 Z"
          fill={colorScheme.secondary}
          opacity="0.5"
        />
        {/* 中間のページ */}
        <path
          d="M 51 65 L 78 89 L 81 87 L 54 63 Z"
          fill={colorScheme.secondary}
          opacity="0.7"
        />
        {/* 一番手前のページ */}
        <path
          d="M 51 66 L 76 90 L 79 88 L 54 64 Z"
          fill={colorScheme.primary}
        />
        {/* ページのエッジ（厚み） */}
        <path d="M 76 90 L 79 88 L 79 87 L 76 89 Z" fill={colorScheme.accent} />
      </g>
    </svg>
  );
}
