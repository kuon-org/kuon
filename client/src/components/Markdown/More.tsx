import { MenuItem } from "@mui/material"
import { MoreHButton } from "../common/MoreHbutton"
import { Link, useNavigate } from "@tanstack/react-router"
import { articleEditRoute, articleLikerRoute } from "../../router" // ルート定義をインポート
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from "@mui/icons-material/Favorite";
import { StyledListHeader } from "../common/StyledListHeader";
import { useArticles } from "../../hooks/useArticles";

interface MoreProps {
    username: string
    articleId: string
    isOwned: boolean
}

export const More = ({ username, articleId, isOwned }: MoreProps) => {
    const navigate = useNavigate()
    const { deleteArticle } = useArticles();
    const handleEdit = () => {
        navigate({
            to: articleEditRoute.to,
            params: { articleId },
        })
    }

    const handleDelete = () => {
        if (window.confirm(`「この記事をゴミ箱へ移動します。`)) {
            deleteArticle(articleId);

            navigate({
                to: "/"
            })
        }

    }
    if (!isOwned) return (
        <MoreHButton>

            <StyledListHeader>記事の改善</StyledListHeader>
            <MenuItem></MenuItem>
            <StyledListHeader>記事の情報</StyledListHeader>
            <Link
                to={articleLikerRoute.to}
                params={{ username, articleId }}
                style={{ color: "inherit", textDecoration: "none" }}
            >
                <MenuItem>
                    <FavoriteIcon />いいねしたユーザ一覧
                </MenuItem>
            </Link>
            <MenuItem
                component="a"
                href={`/api/articles/${articleId}.md`}
                rel="noopener noreferrer"
                sx={{
                    color: 'inherit',     // 親の文字色を継承（青くならない）
                    textDecoration: 'none' // 下線を消す
                }}
            >
                <TextSnippetIcon />Markdownで本文を見る
            </MenuItem>
            <StyledListHeader>オプション</StyledListHeader>
            <MenuItem></MenuItem>
        </MoreHButton>
    )
    return (
        <MoreHButton>
            <StyledListHeader>記事の編集</StyledListHeader>
            <MenuItem
                onClick={handleEdit}

            >
                <ModeEditIcon />編集する
            </MenuItem>
            <StyledListHeader>記事の情報</StyledListHeader>
            <Link
                to={articleLikerRoute.to}
                params={{ username, articleId }}
                style={{ color: "inherit", textDecoration: "none" }}
            >
                <MenuItem>
                    <FavoriteIcon />いいねしたユーザ一覧
                </MenuItem>
            </Link>
            <MenuItem
                component="a"
                href={`/api/articles/${articleId}.md`}
                rel="noopener noreferrer"
                sx={{
                    color: 'inherit',     // 親の文字色を継承（青くならない）
                    textDecoration: 'none' // 下線を消す
                }}
            >
                <TextSnippetIcon />Markdownで本文を見る
            </MenuItem>
            <StyledListHeader>記事の削除</StyledListHeader>
            <MenuItem
                onClick={handleDelete}
            >
                <DeleteIcon />削除する
            </MenuItem>
        </MoreHButton>
    )
}