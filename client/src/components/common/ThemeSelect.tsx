import React from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  type SelectChangeEvent,
} from "@mui/material";
import { useThemeContext } from "../../hooks/useTheme";
import type { ThemeSelectProps } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";

/**
 * @component ThemeSelect
 * @description 利用可能なテーマを選択できるドロップダウンセレクトコンポーネント。
 */
export const ThemeSelect: React.FC<ThemeSelectProps> = ({
  label,
  fullWidth = false,
}) => {
  const { currentTheme, currentThemeName, themeOptions, setThemeByName } =
    useThemeContext();
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t("theme.label");

  const handleChange = (event: SelectChangeEvent<string>) => {
    setThemeByName(event.target.value);
  };

  return (
    <FormControl fullWidth={fullWidth} size="small">
      <InputLabel id="theme-select-label">{resolvedLabel}</InputLabel>
      <Select
        value={currentThemeName}
        onChange={handleChange}
        labelId="theme-select-label"
        label={resolvedLabel}
        sx={{ bgcolor: currentTheme.palette.background.paper }}
      >
        {themeOptions.map((themeOption) => (
          <MenuItem key={themeOption.name} value={themeOption.name}>
            <Box
              sx={{
                display: "inline-block",
                width: 16,
                height: 16,
                bgcolor:
                  themeOption.name === currentThemeName
                    ? currentTheme.palette.background.default
                    : themeOption.theme.palette.background.default,
                borderRadius: "50%",
                borderColor:
                  themeOption.name === currentThemeName
                    ? currentTheme.palette.text.primary
                    : themeOption.theme.palette.background.default,
                outline: "solid 1px",
                mr: 1,
              }}
            />
            {themeOption.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
