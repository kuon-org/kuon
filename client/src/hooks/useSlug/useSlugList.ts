import { useMemo } from "react";
import { remark } from "remark";
import remarkParse from "remark-parse";
import GithubSlugger from "github-slugger";
import type { Root, RootContent, Heading } from "mdast";

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
  options: UseSlugListOptions = {}
): SlugItem[] => {
  const { minLevel = 1, maxLevel = 6 } = options;

  return useMemo(() => {
    // remark-parseでMarkdownをAST(抽象構文木)に変換
    const tree = remark().use(remarkParse).parse(markdownText) as Root;
    const slugs: SlugItem[] = [];
    const slugger = new GithubSlugger();

    const walk = (node: RootContent | Root): void => {
      if (node.type === "heading") {
        const heading = node as Heading;
        if (heading.depth >= minLevel && heading.depth <= maxLevel) {
          // 見出し内のテキストを結合（太字やリンクが含まれていても抽出）
          const text = heading.children
            .map((child) => ("value" in child ? child.value : ""))
            .join("");

          // rehype-slugと同じアルゴリズムでIDを生成
          const id = slugger.slug(text);

          slugs.push({ id, text, level: heading.depth });
        }
      }
      
      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach((child) => walk(child as RootContent));
      }
    };

    walk(tree);
    return slugs;
  }, [markdownText, minLevel, maxLevel]);
};