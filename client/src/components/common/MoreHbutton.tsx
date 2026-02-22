import { useState } from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, Menu, type PopoverOrigin } from '@mui/material';
import type { ReactNode, MouseEvent } from 'react';

interface MoreHButtonProps {
  children: ReactNode;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
}

export const MoreHButton = ({
  children,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
}: MoreHButtonProps) => {
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
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        {children}
      </Menu>
    </>
  );
};