import { useEffect, useMemo, useState } from "react";
import { Add, Delete, Edit, HelpOutline, Refresh } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { WebhookDeliveryLog, WebhookEventProviderFields, WebhookHeaderEditor, WebhookPayloadEditor, providerLabel } from "../../components/Webhook/WebhookEditorSections";
import {
  useDeleteWebhook,
  usePreviewWebhookPayload,
  useSaveWebhook,
  useSetWebhookActive,
  useTestWebhook,
  useWebhookDeliveriesQuery,
  useWebhookMetadataQuery,
  useWebhookQuery,
  useWebhooksQuery,
  type WebhookHeader,
  type WebhookInput,
} from "../../hooks/webhooks";
import { useServerSettingsQuery, useUpdateServerSetting } from "../../hooks/admin";
import { useTranslation } from "react-i18next";

const defaultPayload = { title: "{{article.title}}", description: "{{article.summary}}", url: "{{article.url}}" };

export const Webhooks = () => {
  const { t } = useTranslation("admin");
  const metadataQuery = useWebhookMetadataQuery("admin");
  const webhooksQuery = useWebhooksQuery("admin");
  const saveWebhook = useSaveWebhook("admin");
  const deleteWebhook = useDeleteWebhook("admin");
  const setWebhookActive = useSetWebhookActive("admin");
  const previewPayload = usePreviewWebhookPayload("admin");
  const testSend = useTestWebhook("admin");
  const settingsQuery = useServerSettingsQuery();
  const updateServerSetting = useUpdateServerSetting();
  const settings = settingsQuery.data;
  const metadata = metadataQuery.data;
  const webhooks = webhooksQuery.data ?? [];
  const [editingId, setEditingId] = useState<string>();
  const detailQuery = useWebhookQuery("admin", editingId);
  const deliveriesQuery = useWebhookDeliveriesQuery("admin", editingId);
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<WebhookInput["provider"]>("generic");
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("article.published");
  const [headers, setHeaders] = useState<WebhookHeader[]>([]);
  const [payload, setPayload] = useState<unknown>(defaultPayload);
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultPayload, null, 2));
  const [jsonError, setJsonError] = useState<string>();
  const [preview, setPreview] = useState<unknown>();
  const [testResult, setTestResult] = useState<any>();
  const [helpOpen, setHelpOpen] = useState(false);
  const webhooksEnabled = settings?.find((s) => s.key === "webhooks_enabled")?.value === "true";
  const allowUserWebhooks = settings?.find((s) => s.key === "allow_user_webhooks")?.value === "true";
  const variables = useMemo(() => metadata?.events.find((item) => item.type === event)?.variables ?? [], [metadata, event]);
  const presets = useMemo(() => metadata?.presets.filter((preset) => preset.event === event) ?? [], [metadata, event]);
  const syncPayload = (value: unknown) => { setPayload(value); setJsonText(JSON.stringify(value, null, 2)); setJsonError(undefined); };
  const applyJson = (text: string) => { setJsonText(text); try { setPayload(JSON.parse(text)); setJsonError(undefined); } catch (error) { setJsonError(error instanceof Error ? error.message : "Invalid JSON"); } };
  const resetEditor = () => { setEditingId(undefined); setName(""); setProvider("generic"); setUrl(""); setEvent(metadata?.events[0]?.type ?? "article.published"); setHeaders([]); syncPayload(defaultPayload); setPreview(undefined); setTestResult(undefined); setMode("builder"); };
  const loadWebhook = (id: string) => { setEditingId(id); setPreview(undefined); setTestResult(undefined); };

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) return;
    setName(detail.name);
    setProvider(detail.provider);
    setUrl(detail.url);
    setEvent(detail.event);
    setHeaders(detail.headers ?? []);
    setPayload(detail.payloadTemplate);
    setJsonText(JSON.stringify(detail.payloadTemplate, null, 2));
    setJsonError(undefined);
  }, [detailQuery.data]);

  const applyPreset = (id: string) => { const preset = presets.find((item) => item.id === id); if (!preset) return; setProvider(preset.provider); syncPayload(preset.payloadTemplate); };
  const input = (): WebhookInput => ({ name, scope: "system", provider, url, httpMethod: "POST", payloadTemplate: payload, event, headers, isActive: true });
  if (metadataQuery.isLoading) return <Typography>{t("webhooks.loading")}</Typography>;

  return <Box sx={{ width: "100%", maxWidth: 1040, pb: 8 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}><Box><Typography variant="h5" mb={1}>{t("webhooks.title")}</Typography><Typography color="text.secondary">{t("webhooks.description")}</Typography></Box><Tooltip title={t("webhooks.helpTooltip")}><IconButton onClick={() => setHelpOpen(true)}><HelpOutline /></IconButton></Tooltip></Stack>
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle1" fontWeight={600} mb={1}>{t("webhooks.policy")}</Typography><Stack><FormControlLabel control={<Switch checked={webhooksEnabled} disabled={updateServerSetting.isPending} onChange={(_, checked) => updateServerSetting.mutate({ key: "webhooks_enabled", value: String(checked) })} />} label={t("webhooks.enable")} /><FormControlLabel control={<Switch checked={allowUserWebhooks} disabled={!webhooksEnabled || updateServerSetting.isPending} onChange={(_, checked) => updateServerSetting.mutate({ key: "allow_user_webhooks", value: String(checked) })} />} label={t("webhooks.allowUser")} /></Stack>{!webhooksEnabled && <Alert severity="info" sx={{ mt: 1 }}>{t("webhooks.disabledInfo")}</Alert>}</Paper>
      <Paper variant="outlined" sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}><Typography variant="subtitle1" fontWeight={600}>{t("webhooks.configured")}</Typography><Button startIcon={<Add />} onClick={resetEditor}>{t("webhooks.new")}</Button></Stack>{webhooksQuery.isLoading ? <Typography color="text.secondary">{t("webhooks.loading")}</Typography> : webhooks.length === 0 ? <Typography color="text.secondary">{t("webhooks.empty")}</Typography> : <Stack spacing={1}>{webhooks.map((webhook) => <Paper key={webhook.id} variant="outlined" sx={{ p: 1.5 }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}><Box sx={{ minWidth: 0 }}><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={600}>{webhook.name}</Typography><Chip size="small" label={providerLabel[webhook.provider]} /><Chip size="small" variant="outlined" label={webhook.event} /><Chip size="small" variant="outlined" label={webhook.isActive ? t("webhooks.active") : t("webhooks.disabled")} /></Stack><Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all", mt: 0.5 }}>{webhook.url}</Typography></Box><Stack direction="row" alignItems="center"><Switch checked={webhook.isActive} onChange={(_, checked) => setWebhookActive.mutate({ id: webhook.id, isActive: checked })} /><Tooltip title={t("webhooks.edit")}><IconButton onClick={() => loadWebhook(webhook.id)}><Edit /></IconButton></Tooltip><Tooltip title={t("webhooks.delete")}><IconButton color="error" disabled={deleteWebhook.isPending} onClick={async () => { if (window.confirm(t("webhooks.deleteConfirm", { name: webhook.name }))) { await deleteWebhook.mutateAsync(webhook.id); if (editingId === webhook.id) resetEditor(); } }}><Delete /></IconButton></Tooltip></Stack></Stack></Paper>)}</Stack>}</Paper>
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">{editingId ? t("webhooks.editTitle") : t("webhooks.newTitle")}</Typography>{editingId && <Button startIcon={<Refresh />} onClick={resetEditor}>{t("webhooks.new")}</Button>}</Stack>
      <TextField label={t("webhooks.name")} value={name} onChange={(e) => setName(e.target.value)} /><TextField label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      <WebhookEventProviderFields events={metadata?.events ?? []} event={event} onEventChange={setEvent} provider={provider} onProviderChange={setProvider} presets={presets} onApplyPreset={applyPreset} />
      <WebhookHeaderEditor headers={headers} onChange={setHeaders} />
      <WebhookPayloadEditor mode={mode} onModeChange={setMode} payload={payload} onPayloadChange={syncPayload} variables={variables} jsonText={jsonText} jsonError={jsonError} onJsonChange={applyJson} minRows={16} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" disabled={!!jsonError || previewPayload.isPending} onClick={async () => setPreview((await previewPayload.mutateAsync({ payloadTemplate: payload, eventType: event })).payload)}>{t("webhooks.preview")}</Button><Button variant="outlined" disabled={!url || !!jsonError || testSend.isPending} onClick={async () => setTestResult(await testSend.mutateAsync({ url, headers, payloadTemplate: payload, eventType: event }))}>{t("webhooks.testSend")}</Button><Button variant="contained" disabled={!url || !name || !event || !!jsonError || saveWebhook.isPending} onClick={async () => { await saveWebhook.mutateAsync({ id: editingId, input: input() }); resetEditor(); }}>{editingId ? t("webhooks.update") : t("webhooks.save")}</Button></Stack>
      {preview !== undefined && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" mb={1}>{t("webhooks.preview")}</Typography><Box component="pre" sx={{ m: 0, overflow: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(preview, null, 2)}</Box></Paper>}
      {testResult && <Alert severity={testResult.ok ? "success" : "warning"}>{t("webhooks.testSend")}: HTTP {testResult.status ?? "-"} / {testResult.durationMs ?? "-"}ms</Alert>}
      {editingId && <WebhookDeliveryLog deliveries={deliveriesQuery.data} title={t("webhooks.recentDeliveries")} limit={10} />}
    </Stack>
    <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{t("webhooks.help.title")}</DialogTitle><DialogContent><Stack spacing={2} pt={1}>{[["urlTitle","urlDescription"],["eventTitle","eventDescription"],["templateTitle","templateDescription"],["valuesTitle","valuesDescription"],["testTitle","testDescription"]].map(([title, description]) => <Box key={title}><Typography fontWeight={600}>{t(`webhooks.help.${title}`)}</Typography><Typography color="text.secondary">{t(`webhooks.help.${description}`)}</Typography></Box>)}</Stack></DialogContent></Dialog>
  </Box>;
};