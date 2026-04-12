import {
  MenuItem,
  SwipeableDrawer,
  Box,
  Typography,
  Divider,
} from "@mui/material"; // インポートを追加
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
import TocList from "./TocList"; // TocListをインポート（パスは適宜調整してください）

interface MoreProps {
  username: string;
  articleId: string;
  isOwned: boolean;
  content?: string; // 記事本文を受け取る
}

export const More = ({ username, articleId, isOwned, content }: MoreProps) => {
  // contentを受け取る
  const [openToc, setOpenToc] = useState(false);

  // Drawerの開閉を管理する関数
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpenToc(newOpen);
  };

  // 目次メニュー項目
  const TocMenuItem = (
    <MenuItem onClick={toggleDrawer(true)}>
      <ListIcon />
      目次を表示
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

  // 共通のDrawerコンポーネント（コードの重複を避けるため変数化）
  const tocDrawer = (
    <SwipeableDrawer
      anchor="bottom"
      open={openToc}
      onClose={toggleDrawer(false)}
      onOpen={toggleDrawer(true)}
      sx={{ zIndex: 1300 }} // ボトムバーより上に表示
      PaperProps={{
        sx: {
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          height: "auto",
          maxHeight: "80vh", // 画面の8割まで
        },
      }}
    >
      {/* 引き出しの「つまみ」 */}
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
          <TocList
            content={content}
            // クリックしたらDrawerを閉じる
            onItemClick={() => setOpenToc(false)}
          />
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
              <FavoriteIcon />
              いいねしたユーザ一覧
            </MenuItem>
          </Link>
          <MenuItem
            component="a"
            href={`/api/articles/${articleId}.md`}
            rel="noopener noreferrer"
            sx={{
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <TextSnippetIcon />
            Markdownで本文を見る
          </MenuItem>
        </MoreHButton>
        {tocDrawer} {/* Drawerを配置 */}
      </Box>
    );

  // --- 自分の記事の場合 ---
  return (
    <Box>
      <MoreHButton>
        {/* 編集系メニューの前に目次を追加 */}
        {content && <StyledListHeader>表示オプション</StyledListHeader>}
        {content && TocMenuItem}
        {content && <Divider sx={{ my: 1 }} />}

        <StyledListHeader>記事の編集</StyledListHeader>
        <MenuItem onClick={handleEdit}>
          <ModeEditIcon />
          編集する
        </MenuItem>

        <StyledListHeader>記事の情報</StyledListHeader>
        <Link
          to={articleLikerRoute.to}
          params={{ username, articleId }}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <MenuItem>
            <FavoriteIcon />
            いいねしたユーザ一覧
          </MenuItem>
        </Link>
        <MenuItem
          component="a"
          href={`/api/articles/${articleId}.md`}
          rel="noopener noreferrer"
          sx={{
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <TextSnippetIcon />
          Markdownで本文を見る
        </MenuItem>

        <StyledListHeader>記事の削除</StyledListHeader>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon />
          削除する
        </MenuItem>
      </MoreHButton>
      {tocDrawer} {/* Drawerを配置 */}
    </Box>
  );
};
