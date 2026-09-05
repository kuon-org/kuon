import { useCallback, useState } from "react";
import { IconButton, Tooltip, Box, CircularProgress } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useTranslation } from "react-i18next";
import { StockManageDialog } from "./StockManageDialog";
import { useStocks } from "../../hooks/useStocks";
import { useAuthQuery } from "../../hooks/useAuth";
import { useNotify } from "../../hooks/useNotify";
import { useLongPress } from "../../hooks/useLongPress";

interface StockButtonProps { articleId: string; }

export const StockButton = ({ articleId }: StockButtonProps) => {
  const { t } = useTranslation("articles");
  const [open, setOpen] = useState(false);
  const { isStoredInDefault, toggleDefaultStock, isToggling, defaultList } = useStocks(articleId);
  const { user } = useAuthQuery();
  const { error } = useNotify();
  const isAuth = !!user;

  const openDetail = useCallback(() => {
    if (!isAuth) return error(t("errors:UNAUTHORIZED"));
    setOpen(true);
  }, [isAuth, error, t]);

  const longPressEvents = useLongPress({
    onLongPress: () => { openDetail(); if (navigator.vibrate) navigator.vibrate(50); },
    onClick: () => {
      if (!isAuth) return error(t("errors:UNAUTHORIZED"));
      if (defaultList) toggleDefaultStock(); else openDetail();
    },
    threshold: 500,
  });

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Tooltip title={isStoredInDefault ? t("stock.unstock") : t("stock.stock")} placement="right">
          <IconButton {...longPressEvents} onContextMenu={(e) => { e.preventDefault(); openDetail(); }} sx={{ color: isStoredInDefault ? "primary.main" : "text.secondary", "&:hover": { color: "primary.main" } }}>
            {isToggling ? <CircularProgress size={24} color="inherit" /> : <InventoryIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <StockManageDialog key={articleId} open={open} onClose={() => setOpen(false)} articleId={articleId} />
    </>
  );
};
