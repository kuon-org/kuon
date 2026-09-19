import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import chroma from "chroma-js";
import type { ThemeContextProps, ThemeSelectProviderProps } from "./types";

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

/**
 * @function useThemeContext
 * @description ThemeContextを利用するためのカスタムフック。Provider外で呼び出された場合はエラーを投げる。
 * @returns {ThemeContextProps} 現在のテーマ情報と操作関数
 */
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useThemeContext must be used within ThemeSelectProvider");
  return context;
};

/**
 * @component ThemeSelectProvider
 * @description テーマ選択およびカスタムカラー管理を行うプロバイダコンポーネント。
 * ローカルストレージに選択情報を保存し、次回以降も設定を維持する。
 */
export const ThemeSelectProvider: React.FC<ThemeSelectProviderProps> = ({
  themes,
  colorPresets: initialColorPresets = [],
  children,
}) => {
  const LOCAL_STORAGE_THEME_KEY = "app-theme";
  const LOCAL_STORAGE_COLOR_KEY = "app-primary-color";
  const LOCAL_STORAGE_USE_CUSTOM_COLOR_KEY = "app-use-custom-color";
  const LOCAL_STORAGE_CUSTOM_COLOR_KEY = "app-custom-color";

  const [currentThemeName, setCurrentThemeName] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (saved && themes.find((t) => t.name === saved)) return saved;

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const darkTheme = themes.find((t) => t.name.toLowerCase().includes("dark"));
    if (prefersDark && darkTheme) return darkTheme.name;

    return themes[0].name;
  });

  const currentBaseTheme = themes.find(
    (t) => t.name === currentThemeName,
  )!.theme;

  const [primaryColor, setPrimaryColorState] = useState(() => {
    const savedColor = localStorage.getItem(LOCAL_STORAGE_COLOR_KEY);
    return savedColor || currentBaseTheme.palette.primary.main;
  });

  const [useCustomColor, setUseCustomColorState] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_USE_CUSTOM_COLOR_KEY) === "true";
  });

  const [customColor, setCustomColorState] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_COLOR_KEY);
    return saved || currentBaseTheme.palette.primary.main;
  });

  const setCustomColor = (color: string) => {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_COLOR_KEY, color);
    setCustomColorState(color);

    if (useCustomColor) setPrimaryColor(color);
  };

  const setPrimaryColor = (color: string) => {
    localStorage.setItem(LOCAL_STORAGE_COLOR_KEY, color);
    setPrimaryColorState(color);
  };

  const setUseCustomColor = (value: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_USE_CUSTOM_COLOR_KEY, value.toString());
    setUseCustomColorState(value);
  };

  const setThemeByName = (name: string) => {
    if (themes.find((t) => t.name === name)) setCurrentThemeName(name);
  };

  const currentTheme = useMemo(() => {
    const isDarkMode = currentBaseTheme.palette.mode === "dark";
    if (!useCustomColor) return currentBaseTheme;

    const baseHue = chroma(primaryColor).get("hsl.h");
    const secondaryColor = chroma
      .hsl((baseHue + 180) % 360, 0.5, isDarkMode ? 0.4 : 0.6)
      .hex();
    const backgroundDefault = isDarkMode
      ? chroma(primaryColor).darken(3).hex()
      : chroma(primaryColor).brighten(4).hex();
    const backgroundPaper = isDarkMode
      ? chroma(primaryColor).darken(2).hex()
      : chroma(primaryColor).brighten(3).hex();
    const backgroundLuminance = chroma(backgroundDefault).luminance();
    const isBright = backgroundLuminance > 0.6;
    const dynamicTextPrimary = isBright ? "#000000" : "#ffffff";
    const dynamicTextSecondary = isBright ? "#333333" : "#cccccc";
    const primaryLuminance = chroma(primaryColor).luminance();
    const contrastText = primaryLuminance > 0.6 ? "#000000" : "#ffffff";

    return createTheme({
      ...currentBaseTheme,
      palette: {
        ...currentBaseTheme.palette,
        primary: {
          ...currentBaseTheme.palette.primary,
          main: primaryColor,
          contrastText,
        },
        secondary: {
          ...currentBaseTheme.palette.secondary,
          main: secondaryColor,
        },
        background: {
          ...currentBaseTheme.palette.background,
          default: backgroundDefault,
          paper: backgroundPaper,
        },
        text: {
          ...currentBaseTheme.palette.text,
          primary: dynamicTextPrimary,
          secondary: dynamicTextSecondary,
        },
      },
    });
  }, [currentBaseTheme, primaryColor, useCustomColor]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, currentThemeName);
  }, [currentThemeName]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        currentThemeName,
        themeOptions: themes,
        setThemeByName,
        customColor,
        primaryColor,
        setCustomColor,
        setPrimaryColor,
        useCustomColor,
        setUseCustomColor,
        colorPresets: initialColorPresets,
      }}
    >
      <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
