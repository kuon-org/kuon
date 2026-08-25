import { useMemo, useState } from "react";
import { Add, Delete, Edit, HelpOutline, Refresh } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  WebhookDeliveryLog,
  WebhookEventProviderFields,
  WebhookHeaderEditor,
  WebhookPayloadEditor,
  providerLabel,
} from "../../components/Webhook/WebhookEditorSections";
import {
  useWebhookAdmin,
  type WebhookDelivery,
  type WebhookDetail,
  type WebhookHeader,
  type WebhookInput,
} from "../../hooks/useWebhooks";
import { useServerSettingsQuery } from "../../hooks/useAdmin";

const defaultPayload = {
  title: "{{article.title}}",
  description: "{{article.summary}}",
  url: "{{article.url}}",
};

export const Webhooks = () => {
  const {
    metadata,
    metadataLoading,
    webhooks,
    webhooksLoading,
    getWebhook,
    getDeliveries,
    saveWebhook,
    savePending,
    deleteWebhook,
    deletePending,
    setWebhookActive,
    previewPayload,
    previewPending,
    testSend,
    testPending,
  } = useWebhookAdmin();
  const {
    settings,
    updateServerSetting,
    updateServerSetting_isPending,
  } = useServerSettingsQuery();

  const [editingId, setEditingId] = useState<string>();
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [name, setName] = useState("Article published");
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
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>();

  const webhooksEnabled = settings?.find((s) => s.key === "webhooks_enabled")?.value === "true";
  const allowUserWebhooks = settings?.find((s) => s.key === "allow_user_webhooks")?.value === "true";

  const variables = useMemo(
    () => metadata?.events.find((item) => item.type === event)?.variables ?? [],
    [metadata, event],
  );
  const presets = useMemo(
    () => metadata?.presets.filter((preset) => preset.event === event) ?? [],
    [metadata, event],
  );

  const syncPayload = (value: unknown) => {
    setPayload(value);
    setJsonText(JSON.stringify(value, null, 2));
    setJsonError(undefined);
  };

  const applyJson = (text: string) => {
    setJsonText(text);
    try {
      setPayload(JSON.parse(text));
      setJsonError(undefined);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const resetEditor = () => {
    setEditingId(undefined);
    setName("Article published");
    setProvider("generic");
    setUrl("");
    setEvent(metadata?.events[0]?.type ?? "article.published");
    setHeaders([]);
    syncPayload(defaultPayload);
    setPreview(undefined);
    setTestResult(undefined);
    setDeliveries(undefined);
    setMode("builder");
  };

  const loadWebhook = async (id: string) => {
    const detail: WebhookDetail = await getWebhook(id);
    setEditingId(detail.id);
    setName(detail.name);
    setProvider(detail.provider);
    setUrl(detail.url);
    setEvent(detail.event);
    setHeaders(detail.headers ?? []);
    syncPayload(detail.payloadTemplate);
    setPreview(undefined);
    setTestResult(undefined);
    setDeliveries(await getDeliveries(id));
  };

  const applyPreset = (id: string) => {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setProvider(preset.provider);
    syncPayload(preset.payloadTemplate);
  };

  const input = (): WebhookInput => ({
    name,
    scope: "system",
    provider,
    url,
    httpMethod: "POST",
    payloadTemplate: payload,
    event,
    headers,
    isActive: true,
  });

  if (metadataLoading) return <Typography>Webhook metadata loading...</Typography>;

  return (
    <Box sx={{ width: "100%", maxWidth: 1040, pb: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" mb={1}>Webhooks</Typography>
          <Typography color="text.secondary">
            KuonのイベントをDiscord / Slack / Teams / 任意HTTP endpointへ通知できます。
          </Typography>
        </Box>
        <Tooltip title="Webhook設定のヘルプ">
          <IconButton onClick={() => setHelpOpen(true)}><HelpOutline /></IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Webhook policy</Typography>
          <Stack>
            <FormControlLabel
              control={<Switch checked={webhooksEnabled} disabled={updateServerSetting_isPending} onChange={(_, checked) => updateServerSetting({ key: "webhooks_enabled", value: String(checked) })} />}
              label="Webhooksを有効にする"
            />
            <FormControlLabel
              control={<Switch checked={allowUserWebhooks} disabled={!webhooksEnabled || updateServerSetting_isPending} onChange={(_, checked) => updateServerSetting({ key: "allow_user_webhooks", value: String(checked) })} />}
              label="ユーザー単位Webhookを許可する"
            />
          </Stack>
          {!webhooksEnabled && <Alert severity="info" sx={{ mt: 1 }}>Webhook定義は保存できますが、全体設定がOFFの間は実イベントから送信されません。</Alert>}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight={600}>Configured webhooks</Typography>
            <Button startIcon={<Add />} onClick={resetEditor}>New webhook</Button>
          </Stack>
          {webhooksLoading ? <Typography color="text.secondary">Loading...</Typography> : webhooks.length === 0 ? (
            <Typography color="text.secondary">まだWebhookは登録されていません。</Typography>
          ) : (
            <Stack spacing={1}>
              {webhooks.map((webhook) => (
                <Paper key={webhook.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ sm: "center" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={600}>{webhook.name}</Typography>
                        <Chip size="small" label={providerLabel[webhook.provider]} />
                        <Chip size="small" variant="outlined" label={webhook.event} />
                        <Chip size="small" variant="outlined" label={webhook.isActive ? "Active" : "Disabled"} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all", mt: 0.5 }}>{webhook.url}</Typography>
                    </Box>
                    <Stack direction="row" alignItems="center">
                      <Switch checked={webhook.isActive} onChange={(_, checked) => setWebhookActive({ id: webhook.id, isActive: checked })} />
                      <Tooltip title="編集"><IconButton onClick={() => loadWebhook(webhook.id)}><Edit /></IconButton></Tooltip>
                      <Tooltip title="削除"><IconButton color="error" disabled={deletePending} onClick={async () => { if (window.confirm(`Webhook「${webhook.name}」を削除しますか？`)) { await deleteWebhook(webhook.id); if (editingId === webhook.id) resetEditor(); } }}><Delete /></IconButton></Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <Divider />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editingId ? "Edit webhook" : "New webhook"}</Typography>
          {editingId && <Button startIcon={<Refresh />} onClick={resetEditor}>New webhook</Button>}
        </Stack>

        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Webhook URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />

        <WebhookEventProviderFields
          events={metadata?.events ?? []}
          event={event}
          onEventChange={setEvent}
          provider={provider}
          onProviderChange={setProvider}
          presets={presets}
          onApplyPreset={applyPreset}
        />

        <WebhookHeaderEditor headers={headers} onChange={setHeaders} />

        <WebhookPayloadEditor
          mode={mode}
          onModeChange={setMode}
          payload={payload}
          onPayloadChange={syncPayload}
          variables={variables}
          jsonText={jsonText}
          jsonError={jsonError}
          onJsonChange={applyJson}
          minRows={16}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" disabled={!!jsonError || previewPending} onClick={async () => setPreview((await previewPayload({ payloadTemplate: payload, eventType: event })).payload)}>Preview</Button>
          <Button variant="outlined" disabled={!url || !!jsonError || testPending} onClick={async () => setTestResult(await testSend({ url, headers, payloadTemplate: payload, eventType: event }))}>Test Send</Button>
          <Button variant="contained" disabled={!url || !name || !event || !!jsonError || savePending} onClick={async () => { await saveWebhook({ id: editingId, input: input() }); resetEditor(); }}>{editingId ? "Update" : "Save"}</Button>
        </Stack>

        {preview !== undefined && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" mb={1}>Preview</Typography><Box component="pre" sx={{ m: 0, overflow: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(preview, null, 2)}</Box></Paper>}
        {testResult && <Alert severity={testResult.ok ? "success" : "warning"}>Test Send: HTTP {testResult.status ?? "-"} / {testResult.durationMs ?? "-"}ms</Alert>}

        {editingId && <WebhookDeliveryLog deliveries={deliveries} title="Recent deliveries" limit={10} />}
      </Stack>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Webhook設定ヘルプ</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <Box><Typography fontWeight={600}>1. 送信先URL</Typography><Typography color="text.secondary">Discord Incoming Webhook、Slack Incoming Webhook、Teams Workflow/Webhook、または任意のHTTP endpoint URLを指定します。</Typography></Box>
            <Box><Typography fontWeight={600}>2. Event</Typography><Typography color="text.secondary">Webhookごとにイベントを1つ選択します。同じURLへ別イベントを送る場合はWebhook設定を分けてください。</Typography></Box>
            <Box><Typography fontWeight={600}>3. Template</Typography><Typography color="text.secondary">選択中のイベントに対応するDiscord / Slack / Teamsテンプレートを適用できます。適用後も自由に編集できます。</Typography></Box>
            <Box><Typography fontWeight={600}>4. Kuon values</Typography><Typography color="text.secondary">利用可能な変数は選択中のイベントに応じて変わります。JSONモードでは変数一覧からコピーできます。</Typography></Box>
            <Box><Typography fontWeight={600}>5. Preview / Test Send</Typography><Typography color="text.secondary">Previewでサンプルデータを展開したJSONを確認し、Test Sendで実際の送信先へ試験通知できます。</Typography></Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};