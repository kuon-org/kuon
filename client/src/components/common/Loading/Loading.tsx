import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loading: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh', // 画面中央に表示
      }}
    >
      <CircularProgress size={80} thickness={5} />
    </Box>
  );
};

export default Loading;
