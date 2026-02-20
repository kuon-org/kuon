import React, { forwardRef } from 'react';
import { Box } from '@mui/material';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownPageProps {
  text: string;
}

const Markdown = forwardRef<HTMLDivElement, MarkdownPageProps>(
  ({ text }, ref) => (
    <Box
      ref={ref}
      className="markdown-scroll-container"
      
    >
      <MarkdownRenderer text={text} />
    </Box>
  )
);

Markdown.displayName = 'Markdown';
export default React.memo(Markdown);
