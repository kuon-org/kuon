import React from 'react';
import { Skeleton, Box } from '@mui/material';

interface LoadingSkeltonProps {
  width?: string | number;
  height?: string | number;
  position?: string;
}

const LoadingSkelton: React.FC<LoadingSkeltonProps> = ({ width = '100%', height = '100%', position = "relative" }) => (
  <Box sx={{ position: position, width, height }}>
    <Skeleton
      variant="rectangular"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  </Box>
);

export default LoadingSkelton;
