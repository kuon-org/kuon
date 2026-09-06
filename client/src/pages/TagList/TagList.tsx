import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
  Avatar,
  Paper,
} from "@mui/material";
import { useTagsQuery, type TagListItem } from "../../hooks/tags";
import { useNavigate } from "@tanstack/react-router";
import { tagProfileRoute } from "../../routes";
import { useTranslation } from "react-i18next";

const TagList = () => {
  const { t } = useTranslation("tags");
  const tagsQuery = useTagsQuery();
  const tags = tagsQuery.data ?? [];
  const navigate = useNavigate();

  if (tagsQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tagsQuery.isError) {
    return (
      <Typography color="error" align="center" sx={{ mt: 8 }}>
        {t("list.loadError")}
      </Typography>
    );
  }

  const handleNavigate = (slug: string) => {
    navigate({ to: tagProfileRoute.to, params: { slug }, search: { page: 1 } });
  };

  return (
    <Paper sx={{ mt: 2, mx: "auto", width: { md: 1100 }, p: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={4}>{t("list.title")}</Typography>
      <Grid container spacing={1}>
        {tags.map((tag: TagListItem) => (
          <Grid size={{ xs: 6, sm: 6, md: 3 }} key={tag.id}>
            <Card
              variant="outlined"
              onClick={() => handleNavigate(tag.slug)}
              sx={{ height: 30, width: "fit-content", display: "flex", alignItems: "center", px: 1, borderRadius: "6px", backgroundColor: "background.paper", transition: "0.2s", cursor: "pointer", "&:hover": { boxShadow: 1, borderColor: "primary.light", backgroundColor: "rgba(0, 0, 0, 0.02)" } }}
            >
              <Avatar src={tag.avatar_url || undefined} sx={{ width: 20, height: 20, mr: 1, fontSize: "0.65rem", bgcolor: "white", color: "text.primary" }}>
                {tag.name.substring(0, 1)}
              </Avatar>
              <Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 500, flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tag.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5, minWidth: "fit-content" }}>
                {t("list.articleCount", { count: tag.articleCount })}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TagList;
