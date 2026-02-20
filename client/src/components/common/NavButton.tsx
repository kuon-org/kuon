import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, IconButton as MuiIconButton } from "@mui/material";

interface NavButtonProps {
  path: string; // 遷移先のパス
  message?: string; // ボタンのテキスト
  variant?: "text" | "outlined" | "contained"; // MUIボタンのvariant
  Icon?: ReactNode; // アイコンを渡したい場合
  iconOnly?: boolean; // アイコンボタンモード
  cbfn?: () => void;
}

export const NavButton = ({
  path,
  message = "ボタン",
  variant = "contained",
  Icon,
  iconOnly = false,
  cbfn
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
      startIcon={Icon}
      onClick={cbfn}
    >
      {message}
    </Button>
  );
};
