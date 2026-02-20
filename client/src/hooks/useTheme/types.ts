import type { Theme } from "@mui/material";

/**
 * @typedef {Object} ThemeOption
 * @property {string} name テーマ名
 * @property {Theme} theme MUIのテーマオブジェクト
 */
export interface ThemeOption {
  name: string;
  theme: Theme;
}

/**
 * @typedef {Object} ColorPreset
 * @property {string} name プリセット名
 * @property {string} color カラーコード (#XXXXXX)
 */
export interface ColorPreset {
  name: string;
  color: string;
}

/**
 * @typedef {Object} ThemeContextProps
 * @property {Theme} currentTheme 現在のテーマ
 * @property {string} currentThemeName 現在選択中のテーマ名
 * @property {ThemeOption[]} themeOptions 利用可能なテーマ一覧
 * @property {(name: string) => void} setThemeByName テーマ名でテーマを変更する関数
 * @property {string} primaryColor 現在選択中のプライマリカラー
 * @property {string} customCOlor 作成したカスタムカラー
 * @property {(color: string) => void} setPrimaryColor プライマリカラーを設定する関数
 * @property {(color: string) => void} setCustomColor カスタムカラーを設定する関数
 * @property {boolean} useCustomColor カスタムカラーを使用しているかどうか
 * @property {(value: boolean) => void} setUseCustomColor カスタムカラー使用状態を設定する関数
 * @property {ColorPreset[]} colorPresets 利用可能なプリセットカラー
 */
export interface ThemeContextProps {
  currentTheme: Theme;
  currentThemeName: string;
  themeOptions: ThemeOption[];
  setThemeByName: (name: string) => void;
  primaryColor: string;
  customColor: string;
  setPrimaryColor: (color: string) => void;
  setCustomColor: (color: string) => void;
  useCustomColor: boolean;
  setUseCustomColor: (value: boolean) => void;
  colorPresets: ColorPreset[];
}

/**
 * @typedef {Object} ThemeSelectProviderProps
 * @property {ThemeOption[]} themes 提供するテーマリスト
 * @property {ColorPreset[]} [colorPresets] 提供するプリセットカラーリスト
 * @property {React.ReactNode} children 子要素
 */
export interface ThemeSelectProviderProps {
  themes: ThemeOption[];
  colorPresets?: ColorPreset[];
  children: React.ReactNode;
}

/**
 * @typedef {Object} ColorSelectProps
 * @property {string} [label] ドロップダウン左上に表示するラベル（デフォルト："Color"）
 * @property {string} [defaultLabel] デフォルトカラーのラベル（デフォルト："Default"）
 * @property {string} [customLabel] カスタムカラーのラベル（デフォルト："Custom"）
 */
export interface ColorSelectProps {
    label?: string;
    defaultLabel?: string;
    customLabel?: string;
}

/**
 * @typedef {Object} HueAdjusterProps
 * @property {string} [label] チェックボックスラベル（デフォルト: "カスタムカラーを使用する"）
 */
export interface HueAdjusterProps {
  label?: string;
}

/**
 * @typedef {Object} ThemeSelectProps
 * @property {string} [label] ドロップダウン左上に表示するラベル（デフォルト："Theme"）
 */
export interface ThemeSelectProps {
  label?: string;
  fullWidth?: boolean;
}