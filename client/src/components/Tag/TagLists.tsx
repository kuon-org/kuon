import { useState } from "react";
import { List, ListItemText, Typography, Button, Box, Collapse, ListItemButton, Avatar, ListItemAvatar } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyFollowingTagsQuery } from "../../hooks/tags";
import { Link } from "@tanstack/react-router";
import { tagProfileRoute } from "../../routes";
import { useTranslation } from "react-i18next";

export const TagLists = () => {
  const { t } = useTranslation("tags");
  const authUserQuery = useAuthUserQuery();
  const followingTagsQuery = useMyFollowingTagsQuery(!!authUserQuery.data);
  const myFollowingTags = followingTagsQuery.data;
  const [open, setOpen] = useState(false);

  if (followingTagsQuery.isLoading || followingTagsQuery.isError || !myFollowingTags) return null;

  const INITIAL_COUNT = 5;
  const initialTags = myFollowingTags.slice(0, INITIAL_COUNT);
  const remainingTags = myFollowingTags.slice(INITIAL_COUNT);
  const hasMore = myFollowingTags.length > INITIAL_COUNT;

  const renderTagItem = (tag: (typeof myFollowingTags)[number]) => (
    <Link key={tag.id} to={tagProfileRoute.to} search={{ page: 1 }} params={{ slug: tag.slug }} style={{ textDecoration: "none", color: "inherit" }}>
      <ListItemButton sx={{ py: 0.5 }}>
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Avatar src={tag.avatar_url} alt={tag.name} variant="rounded" sx={{ width: 24, height: 24, fontSize: "0.8rem" }}>
            {tag.name.charAt(0)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={` ${tag.name}`} primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>
    </Link>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 300 }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: "text.secondary", fontWeight: "bold" }}>
        {t("following.title")}
      </Typography>
      <List sx={{ p: 0 }}>
        {initialTags.map(renderTagItem)}
        {hasMore && (
          <>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>{remainingTags.map(renderTagItem)}</List>
            </Collapse>
            <Box sx={{ px: 1 }}>
              <Button fullWidth size="small" startIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setOpen(!open)} sx={{ mt: 0.5, color: "text.secondary", justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem" }}>
                {open ? t("following.collapse") : t("following.showMore")}
              </Button>
            </Box>
          </>
        )}
      </List>
    </Box>
  );
};
