import { Chip } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface CommentJumpProps {
  articleId: string;
  commentCount?: number;
}

export const CommentJump = ({ articleId, commentCount }: CommentJumpProps) => {
  const handleClick = () => {
    // 指定したIDの要素を探す
    const element = document.getElementById(`${articleId}-comment`);
    if (element) {
      // スムーズにスクロールさせる
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Chip
      icon={<ChatBubbleOutlineIcon sx={{ fontSize: '1rem' }} />}
      label={commentCount !== undefined ? `コメント ${commentCount}` : "コメント"}
      onClick={handleClick}
      variant="outlined"
      clickable
      sx={{
        width: "100%",
        mb: 2,
        cursor: "pointer",
        borderRadius: "16px",
        transition: "all 0.2s",
        "&:hover": {
          backgroundColor: "action.hover",
          borderColor: "primary.main",
        },
      }}
    />
  );
};