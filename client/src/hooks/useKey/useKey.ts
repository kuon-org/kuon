
import { useEffect } from "react";
import type { UseKeyOptions } from "./types";
/**
 * useKey - キーボードショートカット用の汎用フック
 *
 * @param {string | string[]} keyOrKeys - 監視するキー。文字列または複数キーの配列
 * @param {() => void} callback - キー押下時に呼ばれる関数
 * @param {object} [options] - オプション設定
 * @param {boolean} [options.preventDefault=false] - true の場合、ブラウザのデフォルト動作を無効化
 * @param {boolean} [options.ctrlKey=false] - Ctrl キー押下時のみ発火
 * @param {boolean} [options.shiftKey=false] - Shift キー押下時のみ発火
 * @param {boolean} [options.altKey=false] - Alt キー押下時のみ発火
 * @param {boolean} [options.once=false] - true の場合、1回だけ発火してリスナーを解除
 */
export function useKey(
  keyOrKeys: string | string[],
  callback: () => void,
  options: UseKeyOptions = {}
) {
  const {
    preventDefault = false,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    once = false,
  } = options;

  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        keys.includes(e.key) &&
        e.ctrlKey === ctrlKey &&
        e.shiftKey === shiftKey &&
        e.altKey === altKey
      ) {
        if (preventDefault) e.preventDefault();
        callback();
        if (once) {
          window.removeEventListener("keydown", handler);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback, keys.join(","), preventDefault, ctrlKey, shiftKey, altKey, once]);
}