import React, { forwardRef } from "react";
import { Box } from "@mui/material";
import MarkdownRenderer from "./MarkdownRenderer";

interface MarkdownPageProps {
  text: string;
  onEditDrawio?: (base64: string) => void;
}

const Markdown = forwardRef<HTMLDivElement, MarkdownPageProps>(
  ({ text, onEditDrawio }, ref) => (
    <Box ref={ref} className="markdown-scroll-container">
      <MarkdownRenderer text={text} onEditDrawio={onEditDrawio} />
    </Box>
  ),
);

Markdown.displayName = "Markdown";
export default React.memo(Markdown);
