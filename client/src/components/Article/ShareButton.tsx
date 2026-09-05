import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import { useNotify } from "../../hooks/useNotify";

interface ShareButtonProps {
  articleId: string;
  title: string;
  summary?: string;
}

export const ShareButton = ({ articleId, title, summary }: ShareButtonProps) => {
  const { success, error } = useNotify();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${articleId}`;
    const shareData: ShareData = {
      title,
      url: shareUrl,
      ...(summary ? { text: summary } : {}),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") {
          return;
        }

        error("記事の共有に失敗しました");
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      success("共有リンクをコピーしました");
    } catch {
      error("共有リンクのコピーに失敗しました");
    }
  };

  return (
    <Tooltip title="共有">
      <IconButton
        aria-label="記事を共有"
        onClick={handleShare}
        sx={{ color: "text.secondary" }}
      >
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
};
