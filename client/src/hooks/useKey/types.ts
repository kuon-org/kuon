/**
 * @typedef {Object} UseKeyOptions
 * @property {boolean} [preventDefault] ブラウザデフォルトの動作を無効化にする
 * @property {boolean} [ctrlKey] Ctrlキーを同時押し対象にする
 * @property {boolean} [shiftKey] Shiftキーを同時押し対象にする
 * @property {boolean} [altKey] Altキーを同時を市対象にする
 * @property {boolean} [once] 押下時に一度だけ実行しリスナーを解除する
 */
export interface UseKeyOptions {
  preventDefault?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  once?: boolean;
};