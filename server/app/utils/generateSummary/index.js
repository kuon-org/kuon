/**
 * Markdown文字列をプレーンテキストに変換し、指定された文字数で抽出します。
 * @param markdown - 対象のMarkdown文字列
 * @param maxLength - 抽出する最大文字数 (デフォルト: 100)
 * @returns 要約された文字列
 */
const generateSummary = (markdown, maxLength = 100) => {
    if (!markdown)
        return "";
    let text = markdown;
    // 1. 画像とリンクの除去 (![alt](url) -> alt, [text](url) -> text)
    text = text.replace(/!\[(.*?)\]\(.*?\)/g, "$1");
    text = text.replace(/\[(.*?)\]\(.*?\)/g, "$1");
    // 2. コードブロックとインラインコードの除去
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/`(.+?)`/g, "$1");
    // 3. 見出し・引用・リスト記号の除去
    text = text.replace(/^#+\s+/gm, "");
    text = text.replace(/^>\s+/gm, "");
    text = text.replace(/^[\s]*[-*+]\s+/gm, "");
    text = text.replace(/^[\s]*\d+\.\s+/gm, "");
    // 4. 装飾（太字・斜体）の除去
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");
    // 5. 水平線の除去
    text = text.replace(/^[-*_]{3,}\s*$/gm, "");
    // 6. 整形：改行をスペースに変換し、連続する空白をまとめる
    const plainText = text
        .replace(/\n+/g, " ") // 改行をスペースに（要約として1行にするため）
        .replace(/\s{2,}/g, " ") // 連続した空白を1つに
        .trim();
    // 7. 指定文字数でカット
    if (plainText.length <= maxLength) {
        return plainText;
    }
    return plainText.substring(0, maxLength) + "...";
};
export default generateSummary;
