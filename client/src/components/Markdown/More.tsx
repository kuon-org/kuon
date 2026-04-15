import {
  MenuItem,
  SwipeableDrawer,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { MoreHButton } from "../common/MoreHbutton";
import { Link, useNavigate } from "@tanstack/react-router";
import { articleEditRoute, articleLikerRoute } from "../../routes";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { StyledListHeader } from "../common/StyledListHeader";
import { useArticles } from "../../hooks/useArticles";
import { useState } from "react";
import ListIcon from "@mui/icons-material/List";
import PresentToAllIcon from "@mui/icons-material/PresentToAll";
import TocList from "./TocList";
import { MarpSlideDialog } from "../Article/MarpSlideDialog";

interface MoreProps {
  username: string;
  articleId: string;
  isOwned: boolean;
  content?: string;
}

export const More = ({ username, articleId, isOwned, content }: MoreProps) => {
  const [openToc, setOpenToc] = useState(false);
  const [openMarp, setOpenMarp] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpenToc(newOpen);
  };

  // メニュークリック時にダイアログを開く
  const handleOpenMarp = () => {
    setOpenMarp(true);
  };

  const TocMenuItem = (
    <MenuItem onClick={toggleDrawer(true)}>
      <ListIcon sx={{ mr: 1 }} />
      目次を表示
    </MenuItem>
  );

  // 2. プレゼンメニュー項目の定義
  const MarpMenuItem = (
    <MenuItem onClick={handleOpenMarp}>
      <PresentToAllIcon sx={{ mr: 1 }} />
      プレゼンテーション形式で表示
    </MenuItem>
  );

  const navigate = useNavigate();
  const { deleteArticle } = useArticles();

  const handleEdit = () => {
    navigate({
      to: articleEditRoute.to,
      params: { articleId },
    });
  };

  const handleDelete = () => {
    if (window.confirm(`「この記事をゴミ箱へ移動します。`)) {
      deleteArticle(articleId);
      navigate({ to: "/" });
    }
  };

  const tocDrawer = (
    <SwipeableDrawer
      anchor="bottom"
      open={openToc}
      onClose={toggleDrawer(false)}
      onOpen={toggleDrawer(true)}
      sx={{ zIndex: 1300 }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          height: "auto",
          maxHeight: "80vh",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 6,
          backgroundColor: "grey.300",
          borderRadius: 3,
          mx: "auto",
          my: 2,
        }}
      />
      <Box sx={{ px: 3, pb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}
        >
          目次
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {content ? (
          <TocList content={content} onItemClick={() => setOpenToc(false)} />
        ) : (
          <Typography
            sx={{ p: 2, color: "text.secondary", textAlign: "center" }}
          >
            目次はありません
          </Typography>
        )}
      </Box>
    </SwipeableDrawer>
  );

  // --- 自分の記事ではない場合 ---
  if (!isOwned)
    return (
      <Box>
        <MoreHButton>
          {content && <StyledListHeader>表示オプション</StyledListHeader>}
          {content && TocMenuItem}
          {content && <Divider sx={{ my: 1 }} />}

          <StyledListHeader>記事の情報</StyledListHeader>
          <Link
            to={articleLikerRoute.to}
            params={{ username, articleId }}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <MenuItem>
              <FavoriteIcon sx={{ mr: 1 }} />
              いいねしたユーザ一覧
            </MenuItem>
          </Link>
          <MenuItem
            component="a"
            href={`/api/articles/${articleId}.md`}
            rel="noopener noreferrer"
            sx={{ color: "inherit", textDecoration: "none" }}
          >
            <TextSnippetIcon sx={{ mr: 1 }} />
            Markdownで本文を見る
          </MenuItem>

          {/* 表示オプションにMarpを追加 */}
          {articleId && MarpMenuItem}
        </MoreHButton>
        {tocDrawer}
        {/* 3. ダイアログを配置 */}
        <MarpSlideDialog
          articleId={articleId}
          open={openMarp}
          onClose={() => setOpenMarp(false)}
        />
      </Box>
    );

  // --- 自分の記事の場合 ---
  return (
    <Box>
      <MoreHButton>
        {content && <StyledListHeader>表示オプション</StyledListHeader>}
        {content && TocMenuItem}
        {content && <Divider sx={{ my: 1 }} />}

        <StyledListHeader>記事の編集</StyledListHeader>
        <MenuItem onClick={handleEdit}>
          <ModeEditIcon sx={{ mr: 1 }} />
          編集する
        </MenuItem>

        <StyledListHeader>記事の情報</StyledListHeader>
        <Link
          to={articleLikerRoute.to}
          params={{ username, articleId }}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <MenuItem>
            <FavoriteIcon sx={{ mr: 1 }} />
            いいねしたユーザ一覧
          </MenuItem>
        </Link>
        <MenuItem
          component="a"
          href={`/api/articles/${articleId}.md`}
          rel="noopener noreferrer"
          sx={{ color: "inherit", textDecoration: "none" }}
        >
          <TextSnippetIcon sx={{ mr: 1 }} />
          Markdownで本文を見る
        </MenuItem>

        {/* 表示オプションにMarpを追加 */}
        {articleId && MarpMenuItem}
        <StyledListHeader>記事の削除</StyledListHeader>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          削除する
        </MenuItem>
      </MoreHButton>
      {tocDrawer}
      {/* 3. ダイアログを配置 */}
      <MarpSlideDialog
        articleId={articleId}
        open={openMarp}
        onClose={() => setOpenMarp(false)}
      />
    </Box>
  );
};
