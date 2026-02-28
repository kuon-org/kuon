import { useState } from "react";
import { IconButton, Tooltip, Box, CircularProgress } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { StockManageDialog } from "./StockManageDialog";
import { useStocks } from "../../hooks/useStocks";

interface StockButtonProps {
  articleId: string;
}

export const StockButton = ({ articleId }: StockButtonProps) => {
  const [open, setOpen] = useState(false);
  const { isStoredInDefault, toggleDefaultStock, isToggling, defaultList } =
    useStocks(articleId);
  const handleClick = () => {
    if (defaultList) {
      // 🚀 デフォルトリストが存在すれば即座に実行
      toggleDefaultStock();
    } else {
      // なければダイアログを開く
      setOpen(true);
    }
  };

  return (
    <>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <Tooltip
          title={isStoredInDefault ? "ストック解除" : "ストック"}
          placement="right"
        >
          <IconButton
            onClick={handleClick}
            onContextMenu={(e) => {
              // 🚀 右クリックで詳細管理ダイアログを開く
              e.preventDefault();
              setOpen(true);
            }}
            sx={{
              // 🚀 保存済みなら色を変える
              color: isStoredInDefault ? "primary.main" : "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            {isToggling ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <InventoryIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <StockManageDialog
        open={open}
        onClose={() => setOpen(false)}
        articleId={articleId}
      />
    </>
  );
};
