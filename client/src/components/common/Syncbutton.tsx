import { IconButton, Tooltip } from "@mui/material";
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import type { Dispatch, SetStateAction } from "react";

interface SyncButtonProps {
    isSync: boolean;
    setIsSync: Dispatch<SetStateAction<boolean>>;
}

export const SyncButton = ({ isSync, setIsSync }: SyncButtonProps) => {
    const handleClick = () => {
        setIsSync((prev) => !prev);
    };

    return (
        <Tooltip title={isSync ? "スクロール同期を解除" : "スクロールを同期"}>
            <IconButton onClick={handleClick} color={isSync ? "primary" : "default"}>
                {isSync ? <SyncIcon /> : <SyncDisabledIcon />}
            </IconButton>
        </Tooltip>
    );
};
