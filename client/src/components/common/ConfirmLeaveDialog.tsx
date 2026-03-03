import { useRouter } from "@tanstack/react-router";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

interface ConfirmLeaveDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ConfirmLeaveDialog = ({
  open,
  onClose,
}: ConfirmLeaveDialogProps) => {
  const router = useRouter();

  const handleConfirm = () => {
    onClose();
    router.history.back(); // 👈 戻る処理
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>変更を保存せずに戻りますか？</DialogTitle>
      <DialogContent>未保存の変更は失われます。</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          戻る
        </Button>
      </DialogActions>
    </Dialog>
  );
};
