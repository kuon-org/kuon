import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Box,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useStocks } from "../../hooks/useStocks"; // 後述するカスタムフック
import { StockCreateDialog } from "./StockCreateDialog";

interface StockManageDialogProps {
  open: boolean;
  onClose: () => void;
  articleId: string;
}

export const StockManageDialog = ({
  open,
  onClose,
  articleId,
}: StockManageDialogProps) => {
  const { lists, isLoading, toggleStock } = useStocks(articleId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
          保存先...
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List>
              {lists?.map((list) => (
                <ListItem key={list.id} disablePadding>
                  <ListItemButton onClick={() => toggleStock(list.id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={list.isStored}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={list.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          <Divider />

          <ListItemButton onClick={() => setCreateOpen(true)}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="新しいリストを作成" />
          </ListItemButton>
        </DialogContent>
      </Dialog>
      <StockCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
};
