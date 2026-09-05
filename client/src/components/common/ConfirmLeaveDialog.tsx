import { useRouter } from "@tanstack/react-router";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface ConfirmLeaveDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ConfirmLeaveDialog = ({
  open,
  onClose,
}: ConfirmLeaveDialogProps) => {
  const router = useRouter();
  const { t } = useTranslation("common");

  const handleConfirm = () => {
    onClose();
    router.history.back();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("confirmLeave.title")}</DialogTitle>
      <DialogContent>{t("confirmLeave.description")}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("actions.cancel")}</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          {t("actions.back")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
