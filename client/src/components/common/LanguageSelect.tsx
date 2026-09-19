import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { changeLocale, enabledLocales } from "../../i18n";
import type { SupportedLocale } from "../../i18n/localeLoaders";

interface LanguageSelectProps {
  label?: string;
  fullWidth?: boolean;
}

export const LanguageSelect = ({
  label,
  fullWidth = false,
}: LanguageSelectProps) => {
  const { t, i18n } = useTranslation("common");
  const selectLabel = label ?? t("language.label");
  const currentLocale = (i18n.resolvedLanguage ?? i18n.language).split(
    "-",
  )[0] as SupportedLocale;

  const handleChange = (event: SelectChangeEvent<SupportedLocale>) => {
    void changeLocale(event.target.value as SupportedLocale);
  };

  return (
    <FormControl fullWidth={fullWidth} size="small">
      <InputLabel id="language-select-label">{selectLabel}</InputLabel>
      <Select
        labelId="language-select-label"
        label={selectLabel}
        value={currentLocale}
        onChange={handleChange}
      >
        {enabledLocales.map((locale) => (
          <MenuItem key={locale} value={locale}>
            {t(`language.options.${locale}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
