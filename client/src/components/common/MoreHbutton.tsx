import { useState } from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, Menu } from '@mui/material';
import type { ReactNode, MouseEvent } from 'react';

interface MoreHButtonProps {
    children: ReactNode;
}

export const MoreHButton = ({ children }: MoreHButtonProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton onClick={handleClick}>
                <MoreHorizIcon />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {children}
            </Menu>
        </>
    );
};
