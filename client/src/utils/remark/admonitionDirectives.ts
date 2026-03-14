// src/utils/remark/admonitionDirectives.ts
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import type {
  Root,
  Blockquote,
  Paragraph,
  PhrasingContent,
  BlockContent,
  Content,
  Text,
} from "mdast";
import type { ContainerDirective } from "mdast-util-directive";

type AdmonitionKind = "note" | "tip" | "warning" | "important" | "caution";

const LABELS: AdmonitionKind[] = [
  "note",
  "tip",
  "warning",
  "important",
  "caution",
];

/**
 * ディレクティブ行の [Label] を {label="..."} 属性に正規化する
 * 例:
 *   :::note[CustomLabel]     -> :::note{label="CustomLabel"}
 *   :::tip[ラベル]            -> :::tip{label="ラベル"}
 * ラベル内の " は &quot; にエスケープ
 */
export function normalizeDirectiveBracketLabelToAttrs(src: string): string {
  // 行頭から :::kind[Label] のパターンを見つける
  const re = /^(:{3,}\s*([A-Za-z]+))\s*\[([^\]]+)\](\s*)$/gm;
  return src.replace(re, (_m, head, _kind, label, tail) => {
    const escaped = String(label).replace(/"/g, "&quot;");
    return `${head}{label="${escaped}"}${tail}`;
  });
}

/** Content が BlockContent かどうか */
function isBlockContent(n: Content): n is BlockContent {
  switch (n.type) {
    case "paragraph":
    case "heading":
    case "code":
    case "html":
    case "thematicBreak":
    case "blockquote":
    case "list":
    case "table":
      return true;
    default:
      return false;
  }
}

/** children を BlockContent[] に正規化 */
function toBlockContents(children: Content[] | undefined): BlockContent[] {
  const arr = children ?? [];
  if (arr.length === 0) return [];

  const allBlock = arr.every((c) => isBlockContent(c));
  if (allBlock) return arr as BlockContent[];

  const para: Paragraph = {
    type: "paragraph",
    children: arr.map((c) => {
      if ((c as any).type && !isBlockContent(c)) {
        return c as PhrasingContent;
      }
      const t: Text = { type: "text", value: "" };
      return t as unknown as PhrasingContent;
    }),
  };
  return [para];
}

/** 先頭段落の先頭 "[Label]" をタイトルに昇格して本文から除去（救済） */
function extractLeadingBracketLabelFromFirstParagraph(blocks: BlockContent[]): {
  label?: string;
  blocks: BlockContent[];
} {
  if (blocks.length === 0) return { blocks };
  const first = blocks[0];
  if (
    first.type !== "paragraph" ||
    !first.children ||
    first.children.length === 0
  ) {
    return { blocks };
  }

  const para = first as Paragraph;
  let consumedCount = 0;
  let headText = "";

  for (const c of para.children) {
    if (c.type === "text") {
      headText += (c as Text).value ?? "";
      consumedCount++;
    } else if (c.type === "break") {
      headText += "\n";
      consumedCount++;
    } else {
      break;
    }
    if (headText.length > 256) break;
  }

  const m = headText.match(/^\s*\[([^\]]+)\]\s*/);
  if (!m) return { blocks };

  const label = m[1].trim();
  const restHead = headText.slice(m[0].length);

  const newChildren: PhrasingContent[] = [];
  if (restHead.length > 0) newChildren.push({ type: "text", value: restHead });
  for (let i = consumedCount; i < para.children.length; i++) {
    newChildren.push(para.children[i] as PhrasingContent);
  }

  const newPara: Paragraph = { ...para, children: newChildren };
  const newBlocks = [...blocks];
  newBlocks[0] = newPara;

  return { label, blocks: newBlocks };
}

/** type guard: ContainerDirective か */
function isContainerDirective(node: unknown): node is ContainerDirective {
  return (
    !!node &&
    typeof (node as any).type === "string" &&
    (node as any).type === "containerDirective"
  );
}

/** ContainerDirective からラベル文字列を取得（型安全 + 実体フォールバック） */
function getDirectiveLabel(node: ContainerDirective): string | undefined {
  // 1) attributes.title / attributes.label を優先（型に存在）
  const attrTitle =
    node.attributes?.title && String(node.attributes.title).trim();
  const attrLabel =
    node.attributes?.label && String(node.attributes.label).trim();
  if (attrTitle) return attrTitle;
  if (attrLabel) return attrLabel;

  // 2) ランタイムでは node.label を載せてくる環境がある → フォールバックで拾う
  //    型は無いので any 経由で安全にアクセス
  const maybe = (node as any).label;
  if (typeof maybe === "string" && maybe.trim()) return maybe.trim();

  return undefined;
}

/**
 * :::note / :::tip[Label] ... ::: を blockquote（data-admonition 付き）へ変換
 */
export const remarkAdmonitionDirectives: Plugin<[], Root> = () => {
  return (tree) => {
    visit(
      tree,
      "containerDirective",
      (
        node: ContainerDirective,
        index: number | undefined,
        parent: Parent | undefined,
      ) => {
        if (!parent || index === undefined) return;
        if (!isContainerDirective(node)) return;

        const name = String(node.name || "").toLowerCase();
        if (!LABELS.includes(name as AdmonitionKind)) return;

        // ラベルを取得（型安全 + 実体フォールバック）
        let explicitTitle = getDirectiveLabel(node);

        // children を BlockContent[] に正規化
        let blockChildren: BlockContent[] = toBlockContents(
          node.children as Content[] | undefined,
        );

        // ラベルが無ければ、本文先頭の "[Label]" を救済抽出
        if (!explicitTitle) {
          const rescued =
            extractLeadingBracketLabelFromFirstParagraph(blockChildren);
          explicitTitle = rescued.label || explicitTitle;
          blockChildren = rescued.blocks;
        }

        const bq: Blockquote = {
          type: "blockquote",
          children: blockChildren,
          position: node.position,
        };

        (bq as any).data = {
          ...(bq as any).data,
          hProperties: {
            className: ["admonition", `admonition-${name}`],
            "data-admonition": name,
            ...(explicitTitle
              ? { "data-admonition-title": explicitTitle }
              : {}),
          },
        };

        parent.children.splice(index, 1, bq);
      },
    );
  };
};
