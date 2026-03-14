import { createTheme } from "@mui/material/styles";

// 勝色 (Katsuiro) をベースにした定数
const KATSUIRO_DEEP = "#181B26"; // 最も深い藍
const KATSUIRO_MAIN = "#232736"; // 表面色に近い藍
const KATSUIRO_LIGHT = "#3B4252"; // 補助的な藍
const ACCENT_BLUE = "#5BB0E5"; // 視認性の高い静かな青

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: KATSUIRO_DEEP, // 勝色をプライマリに据えて信頼感を演出
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5C6B89", // 落ち着いたスレートブルー
      contrastText: "#ffffff",
    },
    background: {
      default: "#F4F7F9", // 少し青みのある白で清潔感を
      paper: "#ffffff",
    },
    text: {
      primary: "#1A202C", // 真っ黒を避け、勝色に近い深いグレー
      secondary: "#5E6C84",
    },
    divider: "rgba(24, 27, 38, 0.08)", // 勝色を薄めた境界線
  },
  shape: {
    borderRadius: 8, // 12から少し削り、シャープでプロ風の印象に
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.05em", // わずかな余白で高級感を
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: ACCENT_BLUE, // ダークモードでは勝色に映える空色をアクセントに
      contrastText: KATSUIRO_DEEP,
    },
    secondary: {
      main: KATSUIRO_LIGHT,
      contrastText: "#ffffff",
    },
    background: {
      default: KATSUIRO_DEEP, // 背景そのものを「勝色」の深淵に
      paper: KATSUIRO_MAIN, // カード類は一段階明るい藍
    },
    text: {
      primary: "#E2E8F0", // 目に優しいオフホワイト
      secondary: "#94A3B8", // 落ち着いた青灰色
    },
    divider: "rgba(255, 255, 255, 0.1)",
    action: {
      active: ACCENT_BLUE,
      disabled: "#94A3B8",
      hover: "rgba(79, 195, 247, 0.08)",
      selected: "rgba(79, 195, 247, 0.16)",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
});
