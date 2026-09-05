import { IconButton, Tooltip } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import SyncDisabledIcon from "@mui/icons-material/SyncDisabled";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

interface SyncButtonProps {
  isSync: boolean;
  setIsSync: Dispatch<SetStateAction<boolean>>;
}

export const SyncButton = ({ isSync, setIsSync }: SyncButtonProps) => {
  const { t } = useTranslation("common");

  const handleClick = () => {
    setIsSync((prev) => !prev);
  };

  return (
    <Tooltip
      title={
        isSync ? t("editor.disableScrollSync") : t("editor.enableScrollSync")
      }
    >
      <IconButton
        onClick={handleClick}
        color={isSync ? "primary" : "default"}
      >
        {isSync ? <SyncIcon /> : <SyncDisabledIcon />}
      </IconButton>
    </Tooltip>
  );
};
