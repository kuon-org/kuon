import {
  BottomNavigation,
  Paper,
  Slide,
  useScrollTrigger,
} from "@mui/material";
import type { ReactNode } from "react";

interface BottomBarProps {
  children?: ReactNode;
}

export const BottomBar = ({ children }: BottomBarProps) => {
  // スクロールを検知（下にスクロールすると trigger が true になる）
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="up" in={!trigger}>
      <Paper
        sx={{
          position: "fixed",
          bottom: 16, // 前回の丸みデザインを継続
          left: 16,
          right: 16,
          borderRadius: "24px",
          overflow: "hidden",
          display: { xs: "flex", sm: "flex", md: "none" },
          zIndex: 1200, // 他の要素より上に表示
        }}
        elevation={4}
      >
        <BottomNavigation
          showLabels
          sx={{
            width: "100%", // ← 幅いっぱい
            display: "flex",
            justifyContent: "space-around", // 子要素を等間隔に配置
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          {children}
        </BottomNavigation>
      </Paper>
    </Slide>
  );
};
