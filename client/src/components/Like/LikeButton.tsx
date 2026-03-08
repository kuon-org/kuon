import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { CircularProgress, IconButton } from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";
import { useNotify } from "../../hooks/useNotify";

interface LikeButtonProps {
  isLiked: boolean;
  isLikePending: boolean;
  likeCount?: number;
  mutateLike: () => void;
}

export const LikeButton = ({
  isLiked,
  isLikePending,
  mutateLike,
}: LikeButtonProps) => {
  const { user } = useAuthQuery();
  const isAuth = !!user;
  const { error } = useNotify();
  const handleClick = () => {
    if (!isAuth) return error("ログインしてください");
    mutateLike();
  };
  return (
    <IconButton
      onClick={handleClick}
      disabled={isLikePending}
      aria-label="like-button"
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        border: "none",
        outline: "none",
        backgroundColor: "background.paper",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isLikePending ? "not-allowed" : "pointer",
        transition: "transform 0.2s ease, background-color 0.2s ease",
        transform: isLiked ? "scale(1.05)" : "scale(1.0)",
      }}
    >
      {isLikePending ? (
        <CircularProgress size={20} />
      ) : isLiked ? (
        <FavoriteIcon
          sx={{
            color: "red",
            fontSize: 24,
            transition: "transform 0.2s ease",
          }}
        />
      ) : (
        <FavoriteBorderIcon
          sx={{
            color: "gray",
            fontSize: 24,
            transition: "transform 0.2s ease",
          }}
        />
      )}
    </IconButton>
  );
};
