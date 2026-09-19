import { Avatar, Box, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";

interface UserCardProps {
  image_src: string;
  username: string;
  display_name: string;
  bio?: string;
  children?: React.ReactNode; // ← フォローボタンを受け取る
}

export const UserCard = ({
  image_src,
  username,
  display_name,
  bio = "",
  children,
}: UserCardProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2,
        borderRadius: 2,
        boxShadow: 1,
        bgcolor: "background.paper",
        gap: 2,
      }}
    >
      <Link to="/$username" params={{ username }}>
        <Avatar
          src={image_src}
          alt={display_name}
          sx={{ width: 56, height: 56, bgcolor: "grey.200" }}
        />
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
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", display: "inline-block" }}
            >
              {display_name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              @{username}
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
