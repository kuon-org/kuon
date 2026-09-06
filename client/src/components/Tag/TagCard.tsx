import { Avatar, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useAuthUserQuery } from "../../hooks/auth";
import { useTagFollowStateQuery, useToggleTagFollow } from "../../hooks/tags";
import Loading from "../common/Loading/Loading";
import { tagProfileRoute } from "../../routes";
import { useTranslation } from "react-i18next";

type Tag = { id: string; name: string; slug: string; avatar_url: string | null; description: string | null; };
type Props = { tag: Tag; };

export const TagCard = ({ tag }: Props) => {
  const { t } = useTranslation("tags");
  const navigate = useNavigate();
  const authUserQuery = useAuthUserQuery();
  const followState = useTagFollowStateQuery(tag.slug, !!authUserQuery.data);
  const toggleFollow = useToggleTagFollow(tag.slug);

  if (followState.isLoading) return <Loading />;
  if (followState.isError) return <>{t("detail.loadError")}</>;

  return (
    <Card
      variant="outlined"
      onClick={() => navigate({ to: tagProfileRoute.to, params: { slug: tag.slug }, search: { page: 1 } })}
      sx={{ cursor: "pointer", borderRadius: 2, mt: 1, width: "auto", transition: "background-color 0.2s", "&:hover": { bgcolor: "action.hover" }, "@media (max-width:600px)": { width: "auto", borderRadius: 0.5, mx: "-16px" } }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={tag.avatar_url ?? undefined} variant="rounded" sx={{ width: 48, height: 48 }} />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flexGrow: 1 }}>
            <Typography fontWeight="bold">{tag.name}</Typography>
            {authUserQuery.data && (
              <Button variant="outlined" onClick={(e) => { e.stopPropagation(); toggleFollow.mutate(tag.slug); }}>
                {followState.data?.isFollow ? t("detail.following") : t("detail.follow")}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
