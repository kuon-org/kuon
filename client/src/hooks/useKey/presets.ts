import { useKey } from "./useKey";
import type { UseKeyOptions } from "./types";
/* ------------------------
   プリセットショートカット
------------------------ */

/**
 * Ctrl + S で保存
 */
export const useSaveShortcut = (callback: () => void) => {
  useKey("s", callback, { ctrlKey: true, preventDefault: true });
};

/**
 * Escape キーでモーダル閉じ
 */
export const useEscapeShortcut = (callback: () => void) => {
  useKey("Escape", callback, { preventDefault: true });
};

/**
 * Enter キーで処理
 */
export const useEnterShortcut = (callback: () => void) => {
  useKey("Enter", callback);
};

/**
 * Ctrl キー + ○キーで処理 
 */
export const useWithCtrlShortcut = (key: string, callback: () => void) => {
    useKey(key, callback, { preventDefault: true, ctrlKey: true })
};

/**
 * 複数キー同時監視用（例: Enter または Escape）
 */
export const useMultiKeyShortcut = (keys: string[], callback: () => void, options?: UseKeyOptions) => {
  useKey(keys, callback, options);
};