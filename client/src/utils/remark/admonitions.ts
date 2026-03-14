// src/utils/remark/admonitions.ts
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, Paragraph, Text, PhrasingContent } from "mdast";

type AdmonitionKind = "note" | "tip" | "warning" | "important" | "caution";

const LABEL_MAP: Record<string, AdmonitionKind> = {
  NOTE: "note",
  TIP: "tip",
  WARNING: "warning",
  IMPORTANT: "important",
  CAUTION: "caution",
};

/**
 * GitHub callouts 互換:
 * > [!NOTE] タイトル
 * > 本文（同じ段落の改行後も本文扱い）
 *
 * 仕様:
 * - blockquote 先頭段落の先頭テキストから [!TAG] を検出
 * - [!TAG] の **同じ行** に続く文字列はタイトルとして保持（data-admonition-title）
 * - タイトルより後ろの **改行以降** は **本文として残す**
 * - hName は変更しない（blockquote のまま）; hProperties に data-* / className を付与
 */
export const remarkAdmonitions: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      if (!node.children?.length) return;

      const first = node.children[0];
      if (first?.type !== "paragraph") return;

      const para = first as Paragraph;
      if (!para.children?.length) return;

      const firstChild = para.children[0];
      if (firstChild?.type !== "text") return;

      const textNode = firstChild as Text;
      const raw = (textNode.value || "").toString();

      // [!NOTE] / [!WARNING] / [!TIP] / [!IMPORTANT] / [!CAUTION]
      const m = raw.match(
        /^\s*\[\!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*(.*)$/i,
      );
      if (!m) return;

      const kind = LABEL_MAP[m[1].toUpperCase()];
      // tokenの同じ行の残りはタイトル
      const restAfterToken = m[2] || "";
      // タイトルと本文（同段落の改行以降）を分ける
      // mdastでは段落内の改行は text.value の中に "\n" として入ることがある
      let titleText = restAfterToken;
      let afterFirstLine = "";

      // もし同じテキストノード内に改行が含まれていたら、最初の改行で分割
      const newlineIdx = titleText.indexOf("\n");
      if (newlineIdx >= 0) {
        afterFirstLine = titleText.slice(newlineIdx + 1);
        titleText = titleText.slice(0, newlineIdx);
      }

      titleText = titleText.trim();

      // ここから本文（最初の段落）を再構成する
      // 1) 先頭テキストノードの value から [!TAG] 行を除去し、"改行以降" だけを残す
      // 2) さらに同段落内に他の子ノード（強調、コード、他の text 等）があれば、それらは本文として残す
      const newChildren: PhrasingContent[] = [];

      // (a) 改行以降を先頭に（本文の先頭）
      if (afterFirstLine.trim().length > 0) {
        newChildren.push({ type: "text", value: afterFirstLine } as Text);
      }

      // (b) 先頭テキストノード以外の残り子を本文として残す
      for (let i = 1; i < para.children.length; i++) {
        newChildren.push(para.children[i] as PhrasingContent);
      }

      if (newChildren.length > 0) {
        // 段落を本文用に上書き
        para.children = newChildren;
      } else {
        // この段落はタイトルのみで本文無し -> 段落ごと削除
        node.children.shift();
      }

      // hProperties / data
      const data = (node as any).data || {};
      const hp = data.hProperties || {};
      const cls: string[] = Array.isArray(hp.className)
        ? [...hp.className]
        : hp.className
          ? String(hp.className).split(/\s+/)
          : [];

      if (!cls.includes("admonition")) cls.push("admonition");
      if (!cls.includes(`admonition-${kind}`)) cls.push(`admonition-${kind}`);

      const hProperties: Record<string, unknown> = {
        ...hp,
        className: cls,
        "data-admonition": kind,
      };
      if (titleText) {
        hProperties["data-admonition-title"] = titleText;
      }

      (node as any).data = {
        ...data,
        hProperties,
        // hName は変更しない（blockquote のまま）
      };
    });
  };
};
