import { useMemo, useRef, useLayoutEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Box, Button } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MermaidRenderer } from "./MermaidRenderer";
import { remarkPlantUML } from "../../utils/remark/plantuml";
import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter";
import { remarkLineNumber } from "../../utils/remark/lineNumber";

interface MarkdownRendererProps {
  text: string;
  onEditDrawio?: (base64: string) => void;
}

const MarkdownRenderer = ({ text, onEditDrawio }: MarkdownRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!text) return;
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el && containerRef.current) {
      const top =
        el.getBoundingClientRect().top -
        containerRef.current.getBoundingClientRect().top;
      containerRef.current.scrollTo({
        top: containerRef.current.scrollTop + top - 16,
        behavior: "smooth",
      });
    }
  }, [text]);

  const components = useMemo(() => {
    return {
      a: ({ href, children }: any) => {
        if (!href) return <>{children}</>;
        if (href.startsWith("#")) {
          return (
            <a
              href={href}
              onClick={(e) => {
                e.preventDefault();
                const id = href.slice(1);
                const el = document.getElementById(id);
                const container = document.querySelector(
                  ".markdown-scroll-container",
                );
                if (el && container) {
                  const top =
                    el.getBoundingClientRect().top -
                    container.getBoundingClientRect().top;
                  container.scrollTo({
                    top: (container as HTMLElement).scrollTop + top - 16,
                    behavior: "smooth",
                  });
                }
                window.location.hash = id;
              }}
            >
              {children}
            </a>
          );
        }
        if (href.startsWith("/")) {
          return <Link to={href}>{children}</Link>;
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },

      img: ({ ...props }: any) => (
        <Box
          component="img"
          sx={{ display: "block", maxWidth: "100%", maxHeight: "80vh", my: 2 }}
          {...props}
        />
      ),

      table: ({ children }: any) => (
        <Box
          component="table"
          sx={{ borderCollapse: "collapse", width: "100%" }}
        >
          {children}
        </Box>
      ),

      th: ({ children }: any) => (
        <Box
          component="th"
          sx={{
            border: "1px solid",
            borderColor: "background.contrastText",
            p: 1,
            textAlign: "left",
          }}
        >
          {children}
        </Box>
      ),

      td: ({ children }: any) => (
        <Box
          component="td"
          sx={{
            border: "1px solid",
            borderColor: "background.contrastText",
            p: 1,
          }}
        >
          {children}
        </Box>
      ),

      code: ({ inline, className, children, node, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");

        if (!inline && match?.[1] === "mermaid") {
          // children は配列/改行を含むことがあるので安定化
          const code = String(children ?? "").trimEnd();

          // ★ node.position が取れるなら key にして再マウントを抑えやすい（任意）
          const key = node?.position?.start?.offset ?? undefined;

          return <MermaidRenderer key={key} code={code} />;
        }

        if (!inline && match?.[1] === "drawio") {
          const base64 = String(children ?? "")
            .trim()
            .replace(/\s/g, "");
          return (
            <Box
              sx={{
                my: 2,
                position: "relative",
                border: "1px solid divider",
                borderRadius: 1,
                "&:hover .edit-btn": {
                  opacity: 1,
                },
              }}
            >
              <Box sx={{ p: 2, textAlign: "start" }}>
                <img
                  src={`data:image/svg+xml;base64,${base64}`}
                  style={{ maxWidth: "100%", height: "auto" }}
                  alt="drawio"
                />
              </Box>
              {onEditDrawio && (
                <Button
                  className="edit-btn"
                  variant="outlined"
                  color="inherit"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    opacity: 0,
                    transition: "opacity 0.2s ease-in-out",
                  }}
                  onClick={() => onEditDrawio(base64)}
                >
                  編集
                </Button>
              )}
            </Box>
          );
        }

        return (
          <CodeSyntaxHighlighter
            inline={inline}
            className={className}
            {...props}
          >
            {children}
          </CodeSyntaxHighlighter>
        );
      },
    };
  }, [onEditDrawio]);

  return (
    <div className="markdown-scroll-container" ref={containerRef}>
      <ReactMarkdown
        children={text}
        remarkPlugins={[
          remarkLineNumber,
          remarkGfm,
          [remarkPlantUML, { plantumlUri: import.meta.env.VITE_PLANTUML_URL }],
        ]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={components}
      />
    </div>
  );
};

export default MarkdownRenderer;
