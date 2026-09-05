import { ContentCopy } from "@mui/icons-material";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import type { WebhookVariable } from "../../hooks/useWebhooks";
import { useTranslation } from "react-i18next";

type AvailableVariablesProps = { variables: WebhookVariable[]; };
export const AvailableVariables = ({ variables }: AvailableVariablesProps) => {
  const { t } = useTranslation("settings");
  if (variables.length === 0) return null;
  const copyVariable = async (key: string) => { await navigator.clipboard.writeText(`{{${key}}}`); };
  return <Box><Typography variant="caption" color="text.secondary">{t("webhooks.variables")}</Typography><Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" mt={0.5}>{variables.map((variable) => <Tooltip key={variable.key} title={t("webhooks.copyVariable", { label: variable.label })}><Chip size="small" variant="outlined" icon={<ContentCopy fontSize="small" />} label={`{{${variable.key}}}`} onClick={() => void copyVariable(variable.key)} sx={{ fontFamily: "monospace" }} /></Tooltip>)}</Stack></Box>;
};
