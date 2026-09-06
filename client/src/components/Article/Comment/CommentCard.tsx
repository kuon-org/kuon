import { useState } from "react";
import {
  Avatar,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LinkIcon from "@mui/icons-material/Link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import {
  useCommentIsLikedQuery,
  useCommentLikeUsersQuery,
  useSoftDeleteComment,
  useToggleCommentLike,
  type Comment as CommentType,
} from "../../../hooks/comments";
import { CommentEditor } from "./CommentEditor";
import { useAuthQuery } from "../../../hooks/useAuth";
import { userProfileIndexRoute } from "../../../routes";
import { Link } from "@tanstack/react-router";
import { LikeButton } from "../../Like/LikeButton";

interface CommentCardProps {
  comment: CommentType;
  depth?: number;
}

export const CommentCard = ({ comment, depth = 0 }: CommentCardProps) => {
  const { t, i18n } = useTranslation("comments");
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useAuthQuery();
  const softDelete = useSoftDeleteComment(comment.article_id);
  const likeUsersQuery = useCommentLikeUsersQuery(comment.article_id, comment.id);
  const isLikedQuery = useCommentIsLikedQuery(comment.article_id, comment.id);
  const toggleLike = useToggleCommentLike(comment.article_id, comment.id);
  const isReply = depth > 0;
  const marginLeft = isReply ? 4 : 0;
  const isMyComment = !!comment.user_id && user?.id === comment.user_id;
  const likeCount = likeUsersQuery.data?.like_count ?? comment.like_count;
  const isLiked = isLikedQuery.data?.isLike ?? false;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleCopyLink = async () => {
    const url = new URL(window.location.href);
    url.hash = `comment-${comment.id}`;
    await navigator.clipboard.writeText(url.toString());
    handleMenuClose();
  };

  const handleDelete = () => {
    if (window.confirm(t("card.deleteConfirm"))) softDelete.mutate(comment.id);
    handleMenuClose();
  };

  return (
    <Box id={`comment-${comment.id}`} sx={{ ml: marginLeft, mb: 2, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          boxShadow: 1,
          bgcolor: "background.paper",
          borderLeft: isReply ? "3px solid" : "none",
          borderColor: "primary.light",
          scrollMarginTop: "100px",
          position: "relative",
        }}
      >
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <IconButton size="small" onClick={handleMenuOpen}><MoreVertIcon fontSize="small" /></IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleCopyLink}>
              <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary={t("card.copyLink")} />
            </MenuItem>
            {isMyComment && !comment.is_deleted && (
              <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
                <ListItemIcon><DeleteOutlineIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText primary={t("card.delete")} />
              </MenuItem>
            )}
          </Menu>
        </Box>

        {!comment.is_deleted && comment.users && (
          <Link
            to={userProfileIndexRoute.to}
            params={{ username: comment.users.username }}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={1} sx={{ pr: 4 }}>
              <Avatar src={comment.users.avatar_url} alt={comment.users.username} sx={{ width: 32, height: 32 }} />
              <Box sx={{ display: "flex" }}>
                <Typography variant="subtitle2">@{comment.users.username}</Typography>
                <Typography variant="subtitle2" component="span" sx={{ ml: 1, fontWeight: "bold" }}>
                  ({comment.users.display_name})
                </Typography>
              </Box>
            </Stack>
          </Link>
        )}

        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.primary", mb: 1, pr: 1 }}>
          {comment.is_deleted ? (
            <span style={{ fontStyle: "italic", color: "gray" }}>{t("card.deleted")}</span>
          ) : (
            comment.body
          )}
        </Typography>

        <Stack direction="row" alignItems="center">
          {!comment.is_deleted && (
            <>
              <LikeButton isLiked={isLiked} isLikePending={toggleLike.isPending} likeCount={likeCount} mutateLike={toggleLike.mutate} />
              <Typography sx={{ fontSize: "0.9rem" }}>{likeCount}</Typography>
            </>
          )}
          <Typography variant="caption" color="text.secondary" ml={comment.is_deleted ? 0 : 2}>
            {new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.created_at))}
          </Typography>
          {!comment.is_deleted && user && (
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => setIsReplyOpen(!isReplyOpen)}
              sx={{ textTransform: "none", fontSize: "0.75rem" }}
            >
              {isReplyOpen ? t("card.cancel") : t("card.reply")}
            </Button>
          )}
        </Stack>
      </Box>

      {isReplyOpen && user && comment.users && (
        <Box sx={{ mt: 1, ml: 2 }}>
          <CommentEditor
            articleId={comment.article_id}
            parentCommentId={comment.id}
            onSuccess={() => setIsReplyOpen(false)}
            placeholder={t("editor.replyPlaceholder", { name: comment.users.display_name })}
          />
        </Box>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {comment.replies.map((reply) => <CommentCard key={reply.id} comment={reply} depth={depth + 1} />)}
        </Box>
      )}
    </Box>
  );
};
