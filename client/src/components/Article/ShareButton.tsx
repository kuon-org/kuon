import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../hooks/useNotify";

interface ShareButtonProps {
  articleId: string;
  title: string;
  summary?: string;
}

export const ShareButton = ({
  articleId,
  title,
  summary,
}: ShareButtonProps) => {
  const { t } = useTranslation("articles");
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
        if (
          shareError instanceof DOMException &&
          shareError.name === "AbortError"
        ) {
          return;
        }
        error(t("share.failed"));
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      success(t("share.copied"));
    } catch {
      error(t("share.copyFailed"));
    }
  };

  return (
    <Tooltip title={t("share.tooltip")}>
      <IconButton
        aria-label={t("share.ariaLabel")}
        onClick={handleShare}
        sx={{ color: "text.secondary" }}
      >
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
};
