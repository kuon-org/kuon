import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, IconButton as MuiIconButton } from "@mui/material";

interface NavButtonProps {
  path: string; // 遷移先のパス
  message?: string; // ボタンのテキスト
  variant?: "text" | "outlined" | "contained"; // MUIボタンのvariant
  color?:
    | "error"
    | "info"
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "warning";
  Icon?: ReactNode; // アイコンを渡したい場合
  iconOnly?: boolean; // アイコンボタンモード
  fullWidth?: boolean;
  cbfn?: () => void;
}

export const NavButton = ({
  path,
  message = "ボタン",
  variant = "contained",
  color = "inherit",
  Icon,
  iconOnly = false,
  fullWidth = false,
  cbfn,
}: NavButtonProps) => {
  if (iconOnly) {
    // アイコンのみの場合（IconButton）
    return (
      <MuiIconButton
        component={Link}
        to={path}
        sx={{ color: "inherit" }}
        onClick={cbfn}
      >
        {Icon}
      </MuiIconButton>
    );
  }

  // 通常のボタン
  return (
    <Button
      component={Link}
      to={path}
      variant={variant}
      color={color}
      startIcon={Icon}
      fullWidth={fullWidth}
      onClick={cbfn}
    >
      {message}
    </Button>
  );
};
