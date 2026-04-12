import {
  List,
  ListItemText,
  Typography,
  Box,
  ListItemButton,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import { useUserQuery } from "../../hooks/useUsers";
import { Link } from "@tanstack/react-router";
// 必要に応じてルーティング用のimportを追加
// import { Link } from "@tanstack/react-router";

export const Ranking = () => {
  const { ranking, rankingIsLoading } = useUserQuery();
  if (rankingIsLoading || !ranking) return null;

  return (
    <Box sx={{ width: "100%", maxWidth: 300 }}>
      <Typography
        variant="subtitle2"
        sx={{ px: 2, py: 1, color: "text.secondary", fontWeight: "bold" }}
      >
        ユーザランキング
      </Typography>

      <List sx={{ p: 0 }}>
        {ranking.map((user, index) => (
          <ListItemButton
            key={user.id}
            sx={{ py: 1 }}
            component={Link}
            to={`/${user.username}`}
          >
            {/* 順位表示 (1, 2, 3...) */}
            <Typography
              variant="caption"
              sx={{
                width: 20,
                mr: 1,
                textAlign: "center",
                fontWeight: index < 3 ? "bold" : "normal",
                color:
                  index === 0
                    ? "gold"
                    : index === 1
                      ? "silver"
                      : index === 2
                        ? "#cd7f32"
                        : "text.secondary",
              }}
            >
              {index + 1}
            </Typography>

            <ListItemAvatar sx={{ minWidth: 40 }}>
              <Avatar
                src={user.avatar_url ?? undefined}
                alt={user.display_name ?? ""}
                sx={{ width: 32, height: 32 }}
              >
                {user.display_name?.charAt(0) ?? user.username?.charAt(0)}
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={"@" + user.username}
              primaryTypographyProps={{
                fontSize: "0.9rem",
                noWrap: true,
                fontWeight: index < 3 ? 500 : 400,
              }}
              // 下に「記事数 + コメント数」などを出したい場合は secondary を利用
              secondary={`${user.contribution} contributions`}
              secondaryTypographyProps={{ fontSize: "0.75rem" }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};
