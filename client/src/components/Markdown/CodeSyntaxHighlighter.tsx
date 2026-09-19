import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Box } from "@mui/material";
import React from "react";

interface CodeSyntaxHighlighterProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "style"
> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CodeSyntaxHighlighter = ({
  inline,
  className,
  children,
  ...props
}: CodeSyntaxHighlighterProps) => {
  const match = /language-(\w+)/.exec(className || "");
  if (!inline && match) {
    return (
      <SyntaxHighlighter
        style={materialDark}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  }

  // インラインコードの場合
  return (
    <Box
      component="code"
      sx={{
        backgroundColor: "background.default",
        borderRadius: 1,
        borderColor: "#ffc3e6",
        borderStyle: "solid",
        borderWidth: 2,
        px: 0.5,
        fontFamily: "monospace",
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
