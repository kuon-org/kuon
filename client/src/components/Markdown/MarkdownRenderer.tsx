import { useMemo, useRef, useLayoutEffect, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Box, Button, GlobalStyles, useTheme } from "@mui/material";
import { Link } from "@tanstack/react-router";
// import { remarkPlantUML } from "../../utils/remark/plantuml";
import { remarkLineNumber } from "../../utils/remark/lineNumber";
import rehypeSanitize from "rehype-sanitize";
import { bootstrapSafeSchema } from "../../utils/rehype/bootstrapSchema";
import { rehypeBootstrapPlugin } from "../../utils/rehype/rehypeBootstrapPlugin";
import remarkDirective from "remark-directive";
import { remarkAdmonitions } from "../../utils/remark/admonitions";
import {
  remarkAdmonitionDirectives,
  normalizeDirectiveBracketLabelToAttrs,
} from "../../utils/remark/admonitionDirectives";
import remarkGemoji from "remark-gemoji";
import { ZoomableContent } from "../common/ZoomableContent";
import LoadingSkelton from "../common/Loading/LoadingSkelton";
import { DrawioRenderer } from "./DrawioRenderer";

const MermaidRenderer = lazy(() =>
  import("./MermaidRenderer").then((module) => ({
    default: module.MermaidRenderer,
  })),
);
const PlantUMLRenderer = lazy(() =>
  import("./PlantUMLRenderer").then((module) => ({
    default: module.PlantUMLRenderer,
  })),
);
const CodeSyntaxHighlighter = lazy(() =>
  import("./CodeSyntaxHighlighter").then((module) => ({
    default: module.CodeSyntaxHighlighter,
  })),
);

interface MarkdownRendererProps {
  text: string;
  onEditDrawio?: (data: string) => void;
}

// ★ 追加：アドモニションの見た目（Material Symbols + MUIテーマ）
const admonitionStyleMap = {
  note: {
    iconName: "info", // ℹ️
    borderColor: "info.light",
    color: (theme: any) => theme.palette.info.main,
    bg: (theme: any) =>
      theme.palette.mode === "dark"
        ? "rgba(25, 118, 210, 0.10)"
        : "rgba(25,118,210,0.06)",
    title: "Note",
  },
  tip: {
    iconName: "lightbulb", // 💡
    borderColor: "success.light",
    color: (theme: any) => theme.palette.success.main,
    bg: (theme: any) =>
      theme.palette.mode === "dark"
        ? "rgba(46, 125, 50, 0.12)"
        : "rgba(46,125,50,0.06)",
    title: "Tip",
  },
  warning: {
    iconName: "warning", // ⚠️
    borderColor: "warning.light",
    color: (theme: any) => theme.palette.warning.main,
    bg: (theme: any) =>
      theme.palette.mode === "dark"
        ? "rgba(237, 108, 2, 0.12)"
        : "rgba(237,108,2,0.06)",
    title: "Warning",
  },
  important: {
    iconName: "feedback", // ！
    borderColor: "secondary.light",
    color: (theme: any) => theme.palette.secondary.main,
    bg: (theme: any) =>
      theme.palette.mode === "dark"
        ? "rgba(156, 39, 176, 0.12)"
        : "rgba(156,39,176,0.06)",
    title: "Important",
  },
  caution: {
    iconName: "report", // 報告/危険
    borderColor: "error.light",
    color: (theme: any) => theme.palette.error.main,
    bg: (theme: any) =>
      theme.palette.mode === "dark"
        ? "rgba(211, 47, 47, 0.12)"
        : "rgba(211,47,47,0.06)",
    title: "Caution",
  },
} as const;

const MarkdownRenderer = ({ text, onEditDrawio }: MarkdownRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = useTheme(); // ★ MUIテーマを取得
  const isDark = theme.palette.mode === "dark";
  const bsTheme = isDark ? "dark" : "light";

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

  const normalized = useMemo(() => {
    let s = normalizeDirectiveBracketLabelToAttrs(text);

    const marpFrontmatter = s.match(/^---[\s\S]*?---/);
    if (marpFrontmatter && /marp\s*:\s*true/.test(marpFrontmatter[0])) {
      s = s.replace(/^---[\s\S]*?---\s*/, "");
    }

    return s;
  }, [text]);

  const components = useMemo(() => {
    return {
      blockquote: ({ children, node, ...props }: any) => {
        // ★ dataは node.properties を優先して安全に取得（rehypeの段階で渡ってくる）
        const propsData = (node as any)?.properties || {};
        const dataAd =
          propsData["data-admonition"] || (props as any)["data-admonition"];
        const dataTitle =
          propsData["data-admonition-title"] ||
          (props as any)["data-admonition-title"];

        const klass = propsData.className;
        let adKind: keyof typeof admonitionStyleMap | undefined = undefined;

        if (typeof dataAd === "string") {
          adKind = dataAd as keyof typeof admonitionStyleMap;
        } else if (Array.isArray(klass)) {
          const hit = (klass as string[]).find((c) =>
            c.startsWith("admonition-"),
          );
          if (hit) adKind = hit.replace("admonition-", "") as any;
        } else if (typeof klass === "string") {
          const hit = (klass as string)
            .split(/\s+/)
            .find((c) => c.startsWith("admonition-"));
          if (hit) adKind = hit.replace("admonition-", "") as any;
        }

        if (adKind && adKind in admonitionStyleMap) {
          const style = admonitionStyleMap[adKind];
          const title = (dataTitle as string) || style.title;

          return (
            <Box
              role="note"
              className={`md-admonition admonition-${adKind}`}
              sx={{
                my: 2,
                mx: 0,
                px: 2,
                py: 1.25,
                borderLeft: "4px solid",
                borderLeftColor: style.borderColor,
                bgcolor: style.bg as any,
                borderRadius: 1,
                "& > :first-of-type": { mt: 0 },
                "& > :last-child": { mb: 0 },
              }}
              {...props}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                  color: style.color as any,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{ display: "inline-flex" }}
                >
                  {style.iconName}
                </span>
                {/* ユーザー要望: アイコン + NOTE これはノートの本文 のように1行見出し表示 */}
                <strong>{title}</strong>
              </Box>
              <div>{children}</div>
            </Box>
          );
        }

        // 従来の blockquote
        return (
          <Box
            component="blockquote"
            className="md-blockquote"
            sx={{
              my: 2,
              mx: 0,
              px: 2,
              py: 1.5,
              borderLeft: "4px solid",
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "background.paper" : "grey.300",
              borderRadius: 1,
              "& > :first-of-type": { mt: 0 },
              "& > :last-child": { mb: 0 },
            }}
            {...props}
          >
            {children}
          </Box>
        );
      },

      div: ({ node, ...props }: any) => {
        return <div {...props}>{props.children}</div>;
      },
      p: ({ node, ...props }: any) => {
        return (
          <p {...props} style={{ marginBlockStart: 0, ...(props.style || {}) }}>
            {props.children}
          </p>
        );
      },
      // 既存 a レンダラ差し替え（抜粋）
      a: ({ href, children, node }: any) => {
        const props = node?.properties || {};

        const finalHref =
          props.href && props.href !== "" ? props.href : href || "";

        const rawClass = props.className || props.class || "";
        const finalClass = Array.isArray(rawClass)
          ? rawClass.join(" ")
          : String(rawClass);

        const bsToggle = props["data-bs-toggle"] || props["dataBsToggle"];
        const bsTarget = props["data-bs-target"] || props["dataBsTarget"];

        const cleanProps: any = {
          href: finalHref || undefined,
          className: finalClass.trim() || undefined,
          id: props.id,
          role: props.role,
        };

        // Bootstrap Data API
        if (bsToggle) {
          return (
            <a
              {...cleanProps}
              data-bs-toggle={bsToggle}
              data-bs-target={bsTarget}
            >
              {children}
            </a>
          );
        }

        // hrefが無い場合
        if (!finalHref) {
          return <span className={cleanProps.className}>{children}</span>;
        }

        // Anchor link
        if (finalHref.startsWith("#")) {
          return (
            <a
              {...cleanProps}
              onClick={(e) => {
                e.preventDefault();

                const id = finalHref.slice(1);
                const el = document.getElementById(id);

                const container = document.querySelector(
                  ".markdown-scroll-container",
                ) as HTMLElement | null;

                if (el && container) {
                  const top =
                    el.getBoundingClientRect().top -
                    container.getBoundingClientRect().top;

                  container.scrollTo({
                    top: container.scrollTop + top - 16,
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

        // SPA内部リンク
        if (finalHref.startsWith("/")) {
          return (
            <Link to={finalHref as any} {...cleanProps}>
              {children}
            </Link>
          );
        }

        // 外部リンク
        return (
          <a {...cleanProps} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },
      img: ({ ...props }: any) => (
        <ZoomableContent>
          <Box
            component="img"
            sx={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "80vh",
              my: 2,
            }}
            {...props}
          />
        </ZoomableContent>
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
        const withSuspense = (component: React.ReactNode) => (
          <Suspense fallback={<LoadingSkelton />}>{component}</Suspense>
        );
        if (!inline && match?.[1] === "plantuml") {
          const code = String(children ?? "").trimEnd();
          return (
            <ZoomableContent>
              {withSuspense(<PlantUMLRenderer code={code} />)}
            </ZoomableContent>
          );
        }
        if (!inline && match?.[1] === "mermaid") {
          // children は配列/改行を含むことがあるので安定化
          const code = String(children ?? "").trimEnd();

          // ★ node.position が取れるなら key にして再マウントを抑えやすい（任意）
          const key = node?.position?.start?.offset ?? undefined;

          return (
            <ZoomableContent>
              {withSuspense(<MermaidRenderer key={key} code={code} />)}
            </ZoomableContent>
          );
        }

        if (!inline && match?.[1] === "drawio") {
          const data = String(children ?? "")
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
              <DrawioRenderer data={data} onEdit={onEditDrawio} />
            </Box>
          );
        }
        if (!inline && match?.[1] === "svg") {
          const svgContent = String(children ?? "").trim();

          // 最低限のサニタイズ（scriptタグの混入防止）
          const isPotentiallyUnsafe = /<script/i.test(svgContent);

          return (
            <Box
              sx={{
                border: "1px solid divider",
                borderRadius: 1,
                overflow: "auto",
              }}
            >
              {isPotentiallyUnsafe ? (
                <Box
                  component="span"
                  sx={{ color: "error.main", fontSize: "0.875rem" }}
                >
                  安全性に問題があるためSVGを表示できません（scriptタグが検出されました）
                </Box>
              ) : (
                <ZoomableContent>
                  <div
                    style={{
                      width: "auto",
                      display: "flex",
                      justifyContent: "flex-start",
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </ZoomableContent>
              )}
            </Box>
          );
        }
        return withSuspense(
          <CodeSyntaxHighlighter
            inline={inline}
            className={className}
            {...props}
          >
            {children}
          </CodeSyntaxHighlighter>,
        );
      },
    };
  }, [onEditDrawio]);

  return (
    <>
      <GlobalStyles
        styles={(t) => ({
          // Markdown内のBootstrapエリアを限定スコープ化
          ".bs-scope": {
            // MUI準拠でBootstrap CSS変数を上書き
            "--bs-body-bg": t.palette.background.default,
            "--bs-body-color": t.palette.text.primary,
            "--bs-border-color": t.palette.divider,

            "--bs-card-bg": t.palette.background.paper,
            "--bs-card-color": t.palette.text.primary,
            "--bs-card-border-color": t.palette.divider,
            "--bs-card-cap-bg": t.palette.action.hover,
            "--bs-card-cap-color": t.palette.text.secondary,

            "--bs-link-color": t.palette.primary.main,
            "--bs-link-hover-color": t.palette.primary.dark,

            "--bs-heading-color": t.palette.text.primary,
            "--bs-secondary-color": t.palette.text.secondary,

            // ユーザー環境で強制したい時の保険（iOS/一部ブラウザ配色ヒント）
            colorScheme: isDark ? "dark" : "light",
          },

          // 念のため明示的に背景/枠へCSS変数を適用（競合時の保険）
          ".bs-scope .card": {
            backgroundColor: "var(--bs-card-bg) !important",
            color: "var(--bs-card-color) !important",
            borderColor: "var(--bs-card-border-color) !important",
          },
          ".bs-scope .card-header, .bs-scope .card-footer": {
            backgroundColor: "var(--bs-card-cap-bg) !important",
            color: "var(--bs-card-color) !important",
            borderColor: "var(--bs-card-border-color) !important",
          },
        })}
      />

      <div
        className="markdown-scroll-container bs-scope"
        data-bs-theme={bsTheme}
      >
        <ReactMarkdown
          children={normalized}
          remarkPlugins={[
            remarkLineNumber,
            remarkDirective,
            remarkAdmonitionDirectives,
            remarkGfm,
            remarkGemoji,
            remarkAdmonitions,
            // [remarkPlantUML, { plantumlUri: "/api/plantuml" }],
          ]}
          rehypePlugins={[
            rehypeRaw,
            rehypeBootstrapPlugin,
            rehypeSlug,
            [rehypeSanitize, bootstrapSafeSchema],
          ]}
          components={components}
        />
      </div>
    </>
  );
};

export default MarkdownRenderer;
