import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";
import {
  useCreatePickupArticle,
  useDeletePickupArticle,
  usePickupArticlesQuery,
} from "../../hooks/users";
import { ArticleCard } from "../../components/Article/ArticleCard";
import type { Article } from "../../hooks/articles";
import { useState } from "react";
import { PickupArticleDialog } from "../../components/Article/PickupArticleDialog";
import PushPinIcon from "@mui/icons-material/PushPin";
import { useTranslation } from "react-i18next";

export const PickupArticles = ({
  userId,
  isMe,
}: {
  userId: string;
  isMe: boolean;
}) => {
  const { t } = useTranslation("users");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pickupQuery = usePickupArticlesQuery(userId);
  const createPickup = useCreatePickupArticle(userId);
  const deletePickup = useDeletePickupArticle(userId);
  const pickup = pickupQuery.data;

  const handleTogglePickup = async (articleId: string, isPicked: boolean) => {
    try {
      if (isPicked) await deletePickup.mutateAsync(articleId);
      else await createPickup.mutateAsync(articleId);
    } catch (err) {
      console.error("Pickup toggle failed", err);
    }
  };

  if (pickupQuery.isLoading)
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Paper
            key={i}
            sx={{
              mx: "auto",
              width: { xs: "100%", sm: "600px" },
              height: "100px",
            }}
          >
            <LoadingSkelton />
          </Paper>
        ))}
      </Box>
    );

  const renderContent = () => {
    if (pickup && pickup.length > 0) {
      return (
        <Paper sx={{ mx: "auto", width: { xs: "100%", sm: "600px" }, p: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            <PushPinIcon />
            {t("pickup.title")}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {pickup.map((p: Article) => (
              <ArticleCard key={p.id} article={p} />
            ))}
          </Box>
          {isMe && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button variant="contained" onClick={() => setIsDialogOpen(true)}>
                {t("pickup.configure")}
              </Button>
            </Box>
          )}
        </Paper>
      );
    }
    if (isMe) {
      return (
        <Paper sx={{ mx: "auto", width: { xs: "100%", sm: "600px" }, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t("pickup.title")}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t("pickup.emptyHint")}
            </Typography>
            <Button variant="contained" onClick={() => setIsDialogOpen(true)}>
              {t("pickup.configure")}
            </Button>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  return (
    <>
      {renderContent()}
      <PickupArticleDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        userId={userId}
        currentPickups={pickup}
        onToggle={handleTogglePickup}
        isSubmitting={createPickup.isPending || deletePickup.isPending}
      />
    </>
  );
};
