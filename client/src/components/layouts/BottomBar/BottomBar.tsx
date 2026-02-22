import { BottomNavigation, Paper } from "@mui/material";
import type { ReactNode } from "react";

interface BottomBarProps {
  children?: ReactNode;
}

export const BottomBar = ({ children }: BottomBarProps) => (
  <Paper
    sx={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: { xs: "flex", sm: "flex", md: "none" },
    }}
    elevation={3}
  >
    <BottomNavigation
      showLabels
      sx={{
        width: "100%",              // ← 幅いっぱい
        display: "flex",
        justifyContent: "space-around", // 子要素を等間隔に配置
        alignItems: "center",
      }}
    >
      {children}
    </BottomNavigation>
  </Paper>
);
