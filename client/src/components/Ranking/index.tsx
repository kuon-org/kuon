import {
  List,
  ListItemText,
  Typography,
  Box,
  ListItemButton,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import { useUserRankingQuery } from "../../hooks/users";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Ranking = () => {
  const { t } = useTranslation("common");
  const rankingQuery = useUserRankingQuery();
  const ranking = rankingQuery.data;
  if (rankingQuery.isLoading || !ranking) return null;

  return (
    <Box sx={{ width: "100%", maxWidth: 300 }}>
      <Typography
        variant="subtitle2"
        sx={{ px: 2, py: 1, color: "text.secondary", fontWeight: "bold" }}
      >
        {t("ranking.title")}
      </Typography>

      <List sx={{ p: 0 }}>
        {ranking.map((user, index) => (
          <ListItemButton
            key={user.id}
            sx={{ py: 1 }}
            component={Link}
            to={`/${user.username}`}
          >
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
              primary={`@${user.username}`}
              primaryTypographyProps={{
                fontSize: "0.9rem",
                noWrap: true,
                fontWeight: index < 3 ? 500 : 400,
              }}
              secondary={t("ranking.contributions", {
                count: user.contribution,
              })}
              secondaryTypographyProps={{ fontSize: "0.75rem" }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};
