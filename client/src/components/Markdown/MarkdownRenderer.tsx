import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Box } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { MermaidRenderer } from './MermaidRenderer';
import { remarkPlantUML } from '../../utils/remark/plantuml';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import { useRef, useLayoutEffect } from 'react';
// import { remarkRedmineDiagram } from '../../utils/remarkRedmineDiagram';
import { remarkLineNumber } from '../../utils/remark/lineNumber';


interface MarkdownRendererProps {
    text: string;
}



const MarkdownRenderer = ({ text }: MarkdownRendererProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!text) return;
        const hash = window.location.hash;
        if (!hash) return;

        const id = hash.slice(1);
        const el = document.getElementById(id);
        if (el && containerRef.current) {
            const top = el.getBoundingClientRect().top - containerRef.current.getBoundingClientRect().top;
            containerRef.current.scrollTo({ top: containerRef.current.scrollTop + top - 16, behavior: 'smooth' });
        }
    }, [text]);
    return (
        <div className="markdown-scroll-container" ref={containerRef}>
            <ReactMarkdown
                children={text}
                remarkPlugins={[remarkLineNumber, remarkGfm, [remarkPlantUML, {
                    plantumlUri: import.meta.env.VITE_PLANTUML_URL
                }]]}
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                    a: ({ href, children }) => {
                        if (!href) return <>{children}</>;
                        if (href.startsWith("#")) {
                            return (
                                <a
                                    href={href}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const id = href.slice(1);
                                        const el = document.getElementById(id);
                                        const container = document.querySelector(".markdown-scroll-container");
                                        if (el && container) {
                                            const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
                                            container.scrollTo({ top: container.scrollTop + top - 16, behavior: "smooth" });
                                        }
                                        window.location.hash = id; // ← ここを変更
                                    }}
                                >
                                    {children}
                                </a>
                            );
                        }
                        // 内部リンクの場合
                        if (href.startsWith("/")) {
                            return <Link to={href}>{children}</Link>;
                        }
                        // 外部リンクの場合
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                                {children}
                            </a>
                        );
                    },
                    img: ({ ...props }) => (
                        <Box component="img" sx={{
                            display: 'block', maxWidth: "100%",
                            maxHeight: '80vh', my: 2
                        }} {...props} />
                    ),
                    table: ({ children }) => <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%' }}>{children}</Box>,
                    th: ({ children }) => <Box component="th" sx={{ border: '1px solid', borderColor: 'background.contrastText', p: 1, textAlign: 'left' }}>{children}</Box>,
                    td: ({ children }) => <Box component="td" sx={{ border: '1px solid', borderColor: 'background.contrastText', p: 1 }}>{children}</Box>,

                    code({ inline, className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean; className?: string; children?: React.ReactNode; }) {
                        const match = /language-(\w+)/.exec(className || "");
                        if (!inline && match && match[1] === "mermaid") {
                            return <MermaidRenderer code={String(children).replace(/\n$/, "")} />;
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
                }}
            />
        </div>

    )

}

export default MarkdownRenderer;