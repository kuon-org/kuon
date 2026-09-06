import { useEffect, useMemo, useState } from "react";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import { Alert, Box, Button, Chip, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
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
  type UserWebhookInput,
  type WebhookHeader,
  type WebhookInput,
} from "../../hooks/webhooks";
import { useTranslation } from "react-i18next";

const defaultPayload = { title: "{{article.title}}", description: "{{article.summary}}", url: "{{article.url}}" };

export const Webhooks = () => {
  const { t } = useTranslation("settings");
  const metadataQuery = useWebhookMetadataQuery("user");
  const webhooksQuery = useWebhooksQuery("user");
  const saveWebhook = useSaveWebhook("user");
  const deleteWebhook = useDeleteWebhook("user");
  const setWebhookActive = useSetWebhookActive("user");
  const previewPayload = usePreviewWebhookPayload("user");
  const testSend = useTestWebhook("user");
  const metadata = metadataQuery.data;
  const webhooks = webhooksQuery.data ?? [];
  const [editingId, setEditingId] = useState<string>();
  const detailQuery = useWebhookQuery("user", editingId);
  const deliveriesQuery = useWebhookDeliveriesQuery("user", editingId);
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
  const input = (): UserWebhookInput => ({ name, provider, url, httpMethod: "POST", payloadTemplate: payload, event, headers, isActive: true });

  if (metadataQuery.isLoading) return <Typography>{t("webhooks.metadataLoading")}</Typography>;
  if (metadataQuery.isError) return <Box sx={{ width: "100%", maxWidth: 760 }}><Typography variant="h5" mb={2}>{t("webhooks.title")}</Typography><Alert severity="info">{t("webhooks.unavailable")}</Alert></Box>;

  return <Box sx={{ width: "100%", maxWidth: 900, pb: 8 }}><Typography variant="h5" mb={1}>{t("webhooks.title")}</Typography><Typography color="text.secondary" mb={3}>{t("webhooks.description")}</Typography><Stack spacing={2}>
    <Paper variant="outlined" sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}><Typography variant="subtitle1" fontWeight={600}>{t("webhooks.configured")}</Typography><Button startIcon={<Add />} onClick={resetEditor}>{t("webhooks.new")}</Button></Stack>
      {webhooksQuery.isLoading ? <Typography color="text.secondary">{t("webhooks.loading")}</Typography> : webhooks.length === 0 ? <Typography color="text.secondary">{t("webhooks.empty")}</Typography> : <Stack spacing={1}>{webhooks.map((webhook) => <Paper key={webhook.id} variant="outlined" sx={{ p: 1.5 }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}><Box sx={{ minWidth: 0 }}><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={600}>{webhook.name}</Typography><Chip size="small" label={providerLabel[webhook.provider]} /><Chip size="small" variant="outlined" label={webhook.event} /><Chip size="small" variant="outlined" label={webhook.isActive ? t("webhooks.active") : t("webhooks.disabled")} /></Stack><Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all", mt: 0.5 }}>{webhook.url}</Typography></Box><Stack direction="row" alignItems="center"><Switch checked={webhook.isActive} onChange={(_, checked) => setWebhookActive.mutate({ id: webhook.id, isActive: checked })} /><Tooltip title={t("webhooks.editAction")}><IconButton onClick={() => loadWebhook(webhook.id)}><Edit /></IconButton></Tooltip><Tooltip title={t("webhooks.deleteAction")}><IconButton color="error" disabled={deleteWebhook.isPending} onClick={async () => { if (window.confirm(t("webhooks.deleteConfirm", { name: webhook.name }))) { await deleteWebhook.mutateAsync(webhook.id); if (editingId === webhook.id) resetEditor(); } }}><Delete /></IconButton></Tooltip></Stack></Stack></Paper>)}</Stack>}
    </Paper>
    <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">{editingId ? t("webhooks.edit") : t("webhooks.new")}</Typography>{editingId && <Button startIcon={<Refresh />} onClick={resetEditor}>{t("webhooks.new")}</Button>}</Stack>
    <TextField label={t("webhooks.name")} value={name} onChange={(e) => setName(e.target.value)} /><TextField label={t("webhooks.url")} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
    <WebhookEventProviderFields events={metadata?.events ?? []} event={event} onEventChange={setEvent} provider={provider} onProviderChange={setProvider} presets={presets} onApplyPreset={applyPreset} />
    <WebhookHeaderEditor headers={headers} onChange={setHeaders} />
    <WebhookPayloadEditor mode={mode} onModeChange={setMode} payload={payload} onPayloadChange={syncPayload} variables={variables} jsonText={jsonText} jsonError={jsonError} onJsonChange={applyJson} />
    <Stack direction="row" spacing={1} flexWrap="wrap"><Button variant="contained" disabled={saveWebhook.isPending || !!jsonError || !event || !name} onClick={async () => { await saveWebhook.mutateAsync({ id: editingId, input: input() }); resetEditor(); }}>{editingId ? t("webhooks.save") : t("webhooks.create")}</Button><Button disabled={previewPayload.isPending || !!jsonError} onClick={async () => setPreview((await previewPayload.mutateAsync({ payloadTemplate: payload, eventType: event })).payload)}>{t("webhooks.preview")}</Button><Button disabled={testSend.isPending || !url || !!jsonError} onClick={async () => setTestResult(await testSend.mutateAsync({ url, headers, payloadTemplate: payload, eventType: event }))}>{t("webhooks.testSend")}</Button></Stack>
    {preview !== undefined && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" mb={1}>{t("webhooks.preview")}</Typography><Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0 }}>{JSON.stringify(preview, null, 2)}</Box></Paper>}
    {testResult && <Alert severity={testResult.ok ? "success" : "warning"}>HTTP {testResult.status} / {testResult.durationMs} ms</Alert>}
    <WebhookDeliveryLog deliveries={deliveriesQuery.data} />
  </Stack></Box>;
};
