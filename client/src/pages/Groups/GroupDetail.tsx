import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useTranslation } from "react-i18next";
import {
  fetchGroup,
  fetchGroupFollowing,
  toggleGroupFollowing,
} from "../../api/groups";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { groupDetailRoute } from "../../routes/groups";
import { useAuthUserQuery } from "../../hooks/auth";

export const GroupDetailPage = () => {
  const { slug } = groupDetailRoute.useParams();
  const { page } = groupDetailRoute.useSearch();
  const { t } = useTranslation("groups");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthUserQuery().data;
  const group = useQuery({
    queryKey: ["groups", slug, page],
    queryFn: () => fetchGroup(slug, page),
  });
  const data = group.data;
  const following = useQuery({
    queryKey: ["groups", slug, "following"],
    queryFn: () => fetchGroupFollowing(slug),
    enabled: !!user,
  });
  const toggleFollow = useMutation({
    mutationFn: () => toggleGroupFollowing(slug),
    onSuccess: (result) =>
      queryClient.setQueryData(["groups", slug, "following"], result),
  });
  const canManage =
    data?.current_user_role === "owner" || data?.current_user_role === "admin";
  if (group.isLoading)
    return (
      <Container sx={{ py: 4 }}>
        <Typography>{t("loading")}</Typography>
      </Container>
    );
  if (!data)
    return (
      <Container sx={{ py: 4 }}>
        <Typography>{t("notFound")}</Typography>
      </Container>
    );
  return (
    <Container sx={{ py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(280px, 360px) minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            position: { md: "sticky" },
            top: { md: 80 },
          }}
        >
          <Paper sx={{ p: 3, position: "relative" }}>
            {canManage && (
              <IconButton
                onClick={() => navigate({ to: `/groups/${slug}/edit` })}
                sx={{ position: "absolute", right: 8, top: 8 }}
                aria-label={t("actions.edit", { defaultValue: "編集" })}
              >
                <MoreHorizIcon />
              </IconButton>
            )}
            <Typography variant="h4" pr={5}>
              {data.display_name}
            </Typography>
            <Typography color="text.secondary">@{data.slug}</Typography>
            <Typography sx={{ mt: 2 }}>{data.description}</Typography>
            {user && (
              <Button
                sx={{ mt: 2 }}
                variant={following.data?.isFollowing ? "contained" : "outlined"}
                disabled={toggleFollow.isPending}
                onClick={() => toggleFollow.mutate()}
              >
                {following.data?.isFollowing
                  ? t("actions.following")
                  : t("actions.follow")}
              </Button>
            )}
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              {t("detail.members")}
            </Typography>
            <Stack divider={<Divider flexItem />}>
              {data.user_groups.map((membership) => (
                <Box
                  key={membership.users.id}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  py={1}
                >
                  <Avatar src={membership.users.avatar_url} />
                  <Box flex={1}>
                    <Typography>{membership.users.display_name}</Typography>
                    <Typography variant="caption">
                      @{membership.users.username}
                    </Typography>
                  </Box>
                  <Typography variant="caption">{membership.role}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" mb={2}>
            {t("detail.articles")}
          </Typography>
          <Stack spacing={2}>
            {data.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};
