import { useMemo, useState } from "react";
import { Add, Delete, Edit, HelpOutline, Refresh } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { AvailableVariables } from "../../components/Webhook/AvailableVariables";
import { PayloadBuilder } from "../../components/Webhook/PayloadBuilder";
import {
  useWebhookAdmin,
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

const providerLabel: Record<WebhookInput["provider"], string> = {
  generic: "Generic",
  discord: "Discord",
  slack: "Slack",
  teams: "Microsoft Teams",
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
  const [deliveries, setDeliveries] = useState<any[]>();

  const webhooksEnabled = settings?.find((s) => s.key === "webhooks_enabled")?.value === "true";
  const allowUserWebhooks = settings?.find((s) => s.key === "allow_user_webhooks")?.value === "true";

  const variables = useMemo(
    () => metadata?.events.find((item) => item.type === event)?.variables ?? [],
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
    setEvent(detail.events[0] ?? metadata?.events[0]?.type ?? "article.published");
    setHeaders(detail.headers ?? []);
    syncPayload(detail.payloadTemplate);
    setPreview(undefined);
    setTestResult(undefined);
    setDeliveries(await getDeliveries(id));
  };

  const applyPreset = (id: string) => {
    const preset = metadata?.presets.find((item) => item.id === id);
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
    events: [event],
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Select value={provider} onChange={(e) => setProvider(e.target.value as WebhookInput["provider"])} sx={{ minWidth: 180 }}>
            {Object.entries(providerLabel).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </Select>
          <Select displayEmpty value="" onChange={(e) => applyPreset(e.target.value)} sx={{ minWidth: 300 }}>
            <MenuItem value="" disabled>Apply template...</MenuItem>
            {metadata?.presets.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                <Box><Typography variant="body2">{preset.name}</Typography><Typography variant="caption" color="text.secondary">{preset.description}</Typography></Box>
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" mb={1}>Event</Typography>
          <Select fullWidth value={event} onChange={(e) => setEvent(e.target.value)}>
            {metadata?.events.map((item) => (
              <MenuItem key={item.type} value={item.type}>{item.displayName}</MenuItem>
            ))}
          </Select>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Headers</Typography>
            <Button onClick={() => setHeaders([...headers, { name: "", value: "" }])}>+ Header</Button>
          </Stack>
          <Stack spacing={1} mt={1}>
            {headers.map((header, index) => (
              <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField size="small" label="Name" value={header.name} onChange={(e) => { const next = [...headers]; next[index] = { ...header, name: e.target.value }; setHeaders(next); }} />
                <TextField size="small" label="Value" type={header.isSecret ? "password" : "text"} value={header.value} onChange={(e) => { const next = [...headers]; next[index] = { ...header, value: e.target.value }; setHeaders(next); }} sx={{ flex: 1 }} />
                <FormControlLabel control={<Checkbox checked={header.isSecret ?? false} onChange={(e) => { const next = [...headers]; next[index] = { ...header, isSecret: e.target.checked }; setHeaders(next); }} />} label="Secret" />
                <Button color="error" onClick={() => setHeaders(headers.filter((_, i) => i !== index))}>Delete</Button>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 2 }}>
            <Tab value="builder" label="Visual Builder" />
            <Tab value="json" label="JSON" />
          </Tabs>
          {mode === "builder" ? (
            <PayloadBuilder value={payload} variables={variables} onChange={syncPayload} />
          ) : (
            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="flex-end"><AvailableVariables variables={variables} /></Box>
              <TextField multiline minRows={16} fullWidth value={jsonText} onChange={(e) => applyJson(e.target.value)} error={!!jsonError} helperText={jsonError ?? "選択したイベントで利用可能なKuon variableを使用できます"} inputProps={{ style: { fontFamily: "monospace" } }} />
            </Stack>
          )}
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" disabled={!!jsonError || previewPending} onClick={async () => setPreview((await previewPayload({ payloadTemplate: payload, eventType: event })).payload)}>Preview</Button>
          <Button variant="outlined" disabled={!url || !!jsonError || testPending} onClick={async () => setTestResult(await testSend({ url, headers, payloadTemplate: payload, eventType: event }))}>Test Send</Button>
          <Button variant="contained" disabled={!url || !name || !event || !!jsonError || savePending} onClick={async () => { await saveWebhook({ id: editingId, input: input() }); resetEditor(); }}>{editingId ? "Update" : "Save"}</Button>
        </Stack>

        {preview !== undefined && <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" mb={1}>Preview</Typography><Box component="pre" sx={{ m: 0, overflow: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(preview, null, 2)}</Box></Paper>}
        {testResult && <Alert severity={testResult.ok ? "success" : "warning"}>Test Send: HTTP {testResult.status ?? "-"} / {testResult.durationMs ?? "-"}ms</Alert>}

        {editingId && deliveries && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" mb={1}>Recent deliveries</Typography>
            {deliveries.length === 0 ? <Typography color="text.secondary">Delivery履歴はありません。</Typography> : deliveries.slice(0, 10).map((delivery) => (
              <Stack key={delivery.id} direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" py={0.75} borderBottom={1} borderColor="divider">
                <Typography variant="body2">{new Date(delivery.createdAt).toLocaleString()}</Typography>
                <Typography variant="body2">{delivery.eventType}</Typography>
                <Typography variant="body2" color={delivery.success ? "success.main" : "error.main"}>{delivery.success ? `${delivery.statusCode ?? "OK"}` : delivery.errorMessage ?? "Failed"} / {delivery.durationMs ?? "-"}ms</Typography>
              </Stack>
            ))}
          </Paper>
        )}
      </Stack>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Webhook設定ヘルプ</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <Box><Typography fontWeight={600}>1. 送信先URL</Typography><Typography color="text.secondary">Discord Incoming Webhook、Slack Incoming Webhook、Teams Workflow/Webhook、または任意のHTTP endpoint URLを指定します。</Typography></Box>
            <Box><Typography fontWeight={600}>2. Event</Typography><Typography color="text.secondary">Webhookごとにイベントを1つ選択します。同じURLへ別イベントを送る場合はWebhook設定を分けてください。</Typography></Box>
            <Box><Typography fontWeight={600}>3. Template</Typography><Typography color="text.secondary">Discord / Slack / Teamsはテンプレートを適用すると推奨JSON構造がVisual Builderへ展開されます。適用後も自由に編集できます。</Typography></Box>
            <Box><Typography fontWeight={600}>4. Kuon values</Typography><Typography color="text.secondary">利用可能な変数は選択中のイベントに応じて変わります。JSONモードでは変数一覧からコピーできます。</Typography></Box>
            <Box><Typography fontWeight={600}>5. Preview / Test Send</Typography><Typography color="text.secondary">Previewでサンプルデータを展開したJSONを確認し、Test Sendで実際の送信先へ試験通知できます。</Typography></Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
