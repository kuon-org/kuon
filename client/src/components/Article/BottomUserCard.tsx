import { Avatar, Box, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";

interface BottomUserCardProps {
  image_src: string;
  username: string;
  display_name: string;
  bio?: string;
  children?: React.ReactNode; // ← フォローボタンを受け取る
}

export const BottomUserCard = ({
  image_src,
  username,
  display_name,
  bio = "",
  children,
}: BottomUserCardProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 6,
        py: 4,
        borderRadius: 2,
        boxShadow: 1,
        gap: 2,
      }}
    >
      <Link to="/$username" params={{ username }}>
        <Avatar src={image_src} alt={display_name} sx={{ width: 56, height: 56, bgcolor: "grey.200" }} />
      </Link>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Link
          to="/$username"
          params={{ username }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Box
            sx={{
              display: "inline-block",
              "&:hover *": { textDecoration: "underline" },
              "&:focus *": { textDecoration: "underline" },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", display: "inline-block" }}>
              @{username} ({display_name})
            </Typography>
          </Box>
        </Link>

        <Typography
          variant="body2"
          color="text.primary"
          sx={{ mt: 0.5, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {bio}
        </Typography>
      </Box>

      {/* 👇 子要素（フォローボタン）を右端に配置 */}
      {children && <Box sx={{ ml: 2 }}>{children}</Box>}
    </Box>
  );
};
