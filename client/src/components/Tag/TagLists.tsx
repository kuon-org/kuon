import { useState } from "react";
import {
  List,
  ListItemText,
  Typography,
  Button,
  Box,
  Collapse,
  ListItemButton,
  Avatar, // 追加
  ListItemAvatar, // 追加
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTagsQuery } from "../../hooks/useTags";
import { Link } from "@tanstack/react-router";
import { tagProfileRoute } from "../../router";

export const TagLists = () => {
  const { myFollowingTags, myFollowingTagsIsLoading, myFollowingTagsIsError } =
    useTagsQuery();

  const [open, setOpen] = useState(false);

  if (myFollowingTagsIsLoading || myFollowingTagsIsError || !myFollowingTags) {
    return null;
  }

  const INITIAL_COUNT = 5;
  const initialTags = myFollowingTags.slice(0, INITIAL_COUNT);
  const remainingTags = myFollowingTags.slice(INITIAL_COUNT);
  const hasMore = myFollowingTags.length > INITIAL_COUNT;

  // 共通のレンダリング関数を作成してコードの重複を避ける
  const renderTagItem = (tag: any) => (
    <Link
      key={tag.id}
      to={tagProfileRoute.to}
      search={{ page: 1 }}
      params={{ slug: tag.slug }}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <ListItemButton sx={{ py: 0.5 }}>
        {/* アイコン（画像）部分 */}
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Avatar
            src={tag.avatar_url}
            alt={tag.name}
            variant="rounded" // 四角に近い形にする場合は "rounded"、丸は省略
            sx={{ width: 24, height: 24, fontSize: "0.8rem" }} // サイズを小さめに調整
          >
            {/* 画像がない場合のバックアップとして名前の先頭一文字を表示 */}
            {tag.name.charAt(0)}
          </Avatar>
        </ListItemAvatar>
        {/* テキスト部分 */}
        <ListItemText
          primary={` ${tag.name}`}
          primaryTypographyProps={{ fontSize: "0.9rem" }}
        />
      </ListItemButton>
    </Link>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 300 }}>
      <Typography
        variant="subtitle2"
        sx={{ px: 2, py: 1, color: "text.secondary", fontWeight: "bold" }}
      >
        フォロー中のタグ
      </Typography>

      <List sx={{ p: 0 }}>
        {initialTags.map((tag) => renderTagItem(tag))}

        {hasMore && (
          <>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {remainingTags.map((tag) => renderTagItem(tag))}
              </List>
            </Collapse>

            <Box sx={{ px: 1 }}>
              <Button
                fullWidth
                size="small"
                startIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setOpen(!open)}
                sx={{
                  mt: 0.5,
                  color: "text.secondary",
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontSize: "0.8rem",
                }}
              >
                {open ? "閉じる" : "もっと見る"}
              </Button>
            </Box>
          </>
        )}
      </List>
    </Box>
  );
};
