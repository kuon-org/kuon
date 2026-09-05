import { Delete } from "@mui/icons-material";
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Paper, Select, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import type { WebhookDelivery, WebhookEventMetadata, WebhookHeader, WebhookInput, WebhookPreset, WebhookVariable } from "../../hooks/useWebhooks";
import { AvailableVariables } from "./AvailableVariables";
import { PayloadBuilder } from "./PayloadBuilder";
import { useTranslation } from "react-i18next";

const providerLabel: Record<WebhookInput["provider"], string> = { generic: "Generic", discord: "Discord", slack: "Slack", teams: "Microsoft Teams" };

export const WebhookEventProviderFields = ({ events, event, onEventChange, provider, onProviderChange, presets, onApplyPreset }: { events: WebhookEventMetadata[]; event: string; onEventChange: (event: string) => void; provider: WebhookInput["provider"]; onProviderChange: (provider: WebhookInput["provider"]) => void; presets: WebhookPreset[]; onApplyPreset: (presetId: string) => void; }) => {
  const { t } = useTranslation("settings");
  return <><Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" mb={1}>{t("webhooks.event")}</Typography><Select fullWidth value={event} onChange={(e) => onEventChange(e.target.value)}>{events.map((item) => <MenuItem key={item.type} value={item.type}>{item.displayName}</MenuItem>)}</Select></Paper><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><Select value={provider} onChange={(e) => onProviderChange(e.target.value as WebhookInput["provider"])} sx={{ minWidth: 180 }}>{Object.entries(providerLabel).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select><Select displayEmpty value="" onChange={(e) => onApplyPreset(e.target.value)} sx={{ minWidth: 300 }}><MenuItem value="" disabled>{t("webhooks.applyTemplate")}</MenuItem>{presets.map((preset) => <MenuItem key={preset.id} value={preset.id}><Box><Typography variant="body2">{preset.name}</Typography><Typography variant="caption" color="text.secondary">{preset.description}</Typography></Box></MenuItem>)}</Select></Stack></>;
};

export const WebhookHeaderEditor = ({ headers, onChange }: { headers: WebhookHeader[]; onChange: (headers: WebhookHeader[]) => void; }) => {
  const { t } = useTranslation("settings");
  const update = (index: number, patch: Partial<WebhookHeader>) => onChange(headers.map((header, i) => i === index ? { ...header, ...patch } : header));
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}><Typography variant="subtitle2">{t("webhooks.headers")}</Typography><Button size="small" onClick={() => onChange([...headers, { name: "", value: "", isSecret: false }])}>{t("webhooks.addHeader")}</Button></Stack><Stack spacing={1}>{headers.map((header, index) => <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}><TextField size="small" label={t("webhooks.headerName")} value={header.name} onChange={(e) => update(index, { name: e.target.value })} /><TextField size="small" label={header.isSecret ? t("webhooks.secretValue") : t("webhooks.headerValue")} type={header.isSecret ? "password" : "text"} value={header.value} onChange={(e) => update(index, { value: e.target.value })} sx={{ flex: 1 }} /><FormControlLabel control={<Checkbox checked={header.isSecret ?? false} onChange={(e) => update(index, { isSecret: e.target.checked })} />} label={t("webhooks.secret")} /><IconButton onClick={() => onChange(headers.filter((_, i) => i !== index))}><Delete /></IconButton></Stack>)}</Stack></Paper>;
};

export const WebhookPayloadEditor = ({ mode, onModeChange, payload, onPayloadChange, variables, jsonText, jsonError, onJsonChange, minRows = 14 }: { mode: "builder" | "json"; onModeChange: (mode: "builder" | "json") => void; payload: unknown; onPayloadChange: (payload: unknown) => void; variables: WebhookVariable[]; jsonText: string; jsonError?: string; onJsonChange: (text: string) => void; minRows?: number; }) => {
  const { t } = useTranslation("settings");
  return <Paper variant="outlined" sx={{ p: 2 }}><Tabs value={mode} onChange={(_, value) => onModeChange(value)}><Tab value="builder" label={t("webhooks.builder")} /><Tab value="json" label="JSON" /></Tabs><Box mt={2}>{mode === "builder" ? <PayloadBuilder value={payload} onChange={onPayloadChange} variables={variables} /> : <Stack spacing={1.5}><Box display="flex" justifyContent="flex-end"><AvailableVariables variables={variables} /></Box><TextField multiline minRows={minRows} fullWidth value={jsonText} onChange={(e) => onJsonChange(e.target.value)} error={!!jsonError} helperText={jsonError ?? t("webhooks.jsonHint")} inputProps={{ style: { fontFamily: "monospace" } }} /></Stack>}</Box></Paper>;
};

export const WebhookDeliveryLog = ({ deliveries, title, limit }: { deliveries?: WebhookDelivery[]; title?: string; limit?: number; }) => {
  const { t, i18n } = useTranslation("settings");
  if (!deliveries) return null;
  const rows = limit ? deliveries.slice(0, limit) : deliveries;
  const formatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "medium" });
  return <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" mb={1}>{title ?? t("webhooks.deliveryLogs")}</Typography>{rows.length === 0 ? <Typography color="text.secondary">{t("webhooks.noDeliveries")}</Typography> : <Stack spacing={0.5}>{rows.map((delivery) => <Stack key={delivery.id} direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" py={0.75} borderBottom={1} borderColor="divider"><Typography variant="body2">{formatter.format(new Date(delivery.createdAt))}</Typography><Typography variant="body2">{delivery.eventType}</Typography><Typography variant="body2" color={delivery.success ? "success.main" : "error.main"}>{delivery.success ? `${delivery.statusCode ?? "OK"}` : delivery.errorMessage ?? t("webhooks.failed")} / {delivery.durationMs ?? "-"}ms</Typography></Stack>)}</Stack>}</Paper>;
};

export { providerLabel };
