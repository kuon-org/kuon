import React from "react";
import { Select, MenuItem, FormControl, InputLabel, Box, type SelectChangeEvent } from "@mui/material";
import { useThemeContext } from "../../hooks/useTheme";
import type { ThemeSelectProps } from "../../hooks/useTheme";

/**
 * @component ThemeSelect
 * @description 利用可能なテーマを選択できるドロップダウンセレクトコンポーネント。
 */
export const ThemeSelect: React.FC<ThemeSelectProps> = ({ label = "Theme", fullWidth = false }) => {
  const { currentTheme, currentThemeName, themeOptions, setThemeByName } = useThemeContext();

  const handleChange = (event: SelectChangeEvent<string>) => {
    setThemeByName(event.target.value);
  };

  return (
    <FormControl fullWidth={fullWidth} size="small">
      <InputLabel id="theme-select-label">{label}</InputLabel>
      <Select
        value={currentThemeName}
        onChange={handleChange}
        labelId="theme-select-label"
        label={label}
        sx={{ bgcolor: currentTheme.palette.background.paper }}
      >
        {themeOptions.map((t) => (
          <MenuItem key={t.name} value={t.name}>
            <Box
              sx={{
                display: "inline-block",
                width: 16,
                height: 16,
                bgcolor:
                  t.name === currentThemeName
                    ? currentTheme.palette.background.default
                    : t.theme.palette.background.default,
                borderRadius: "50%",
                borderColor:
                  t.name === currentThemeName
                    ? currentTheme.palette.text.primary
                    : t.theme.palette.background.default,
                outline: "solid 1px",
                mr: 1,
              }}
            />
            {t.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
