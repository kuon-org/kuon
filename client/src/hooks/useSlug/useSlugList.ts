import { useMemo } from "react";
import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import GithubSlugger from "github-slugger";
import type { Root, RootContent, Heading, Content } from "mdast";

export interface SlugItem {
  id: string;
  text: string;
  level: number;
}

interface UseSlugListOptions {
  minLevel?: number;
  maxLevel?: number;
}

export const useSlugList = (
  markdownText: string,
  options: UseSlugListOptions = {},
): SlugItem[] => {
  const { minLevel = 1, maxLevel = 6 } = options;

  return useMemo(() => {
    // Frontmatter対応込みでAST生成
    const tree = remark()
      .use(remarkParse)
      .use(remarkFrontmatter, ["yaml"])
      .parse(markdownText) as Root;

    const slugs: SlugItem[] = [];
    const slugger = new GithubSlugger();

    // 見出し内テキスト抽出（ネスト対応）
    const extractText = (nodes: Content[]): string => {
      return nodes
        .map((node) => {
          if ("value" in node && typeof node.value === "string") {
            return node.value;
          }
          if ("children" in node && Array.isArray(node.children)) {
            return extractText(node.children as Content[]);
          }
          return "";
        })
        .join("");
    };

    const walk = (node: Root | RootContent): void => {
      // YAML frontmatterは完全無視
      if (node.type === "yaml") return;

      // 区切り線 (---) も無視
      if (node.type === "thematicBreak") return;

      if (node.type === "heading") {
        const heading = node as Heading;

        if (heading.depth >= minLevel && heading.depth <= maxLevel) {
          const text = extractText(heading.children).trim();

          // 空文字や "---" などは除外
          if (!text || /^-+$/.test(text)) return;

          const id = slugger.slug(text);

          slugs.push({
            id,
            text,
            level: heading.depth,
          });
        }
      }

      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach((child) => {
          walk(child as RootContent);
        });
      }
    };

    walk(tree);
    return slugs;
  }, [markdownText, minLevel, maxLevel]);
};
