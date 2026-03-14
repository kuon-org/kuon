// src/emoji/index.ts
import data from "emojibase-data/en/compact.json";
import githubShortcodes from "emojibase-data/en/shortcodes/github.json";

// 型はシンプルでOK
export type EmojiItem = {
  emoji: string; // 😄
  shortcode: string; // smile
  label: string; // grinning face with smiling eyes など
  keywords: string[]; // タグ
};

export const EMOJI_ITEMS: EmojiItem[] = (() => {
  // githubShortcodes のキーは Unicode の codepoint 連結（例："1F600"）
  // value は ["smile", "grinning_face"] などの配列
  return data.flatMap((entry) => {
    const codes = entry.hexcode; // "1F600"
    const aliases: string[] = (githubShortcodes as any)[codes] || [];
    return aliases.map((short) => ({
      emoji: entry.unicode!,
      shortcode: short,
      label: entry.label,
      keywords: entry.tags ?? [],
    }));
  });
})();
