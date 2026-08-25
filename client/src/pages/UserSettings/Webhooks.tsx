import { useMemo, useState } from "react";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  useWebhookUser,
  type UserWebhookInput,
  type WebhookDelivery,
  type WebhookDetail,
  type WebhookHeader,
  type WebhookInput,
} from "../../hooks/useWebhooks";

const defaultPayload = {
  title: "{{article.title}}",
  description: "{{article.summary}}",
  url: "{{article.url}}",
};

export const Webhooks = () => {
  const {
    metadata,
    metadataLoading,
    metadataError,
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
  } = useWebhookUser();

  const [editingId, setEditingId] = useState<string>();
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [name, setName] = useState("My webhook");
  const [provider, setProvider] = useState<WebhookInput["provider"]>("generic");
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("article.published");
  const [headers, setHeaders] = useState<WebhookHeader[]>([]);
  const [payload, setPayload] = useState<unknown>(defaultPayload);
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultPayload, null, 2));
  const [jsonError, setJsonError] = useState<string>();
  const [preview, setPreview] = useState<unknown>();
  const [testResult, setTestResult] = useState<any>();
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>();

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
    setName("My webhook");
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

  const input = (): UserWebhookInput => ({
    name,
    provider,
    url,
    httpMethod: "POST",
    payloadTemplate: payload,
    event,
    headers,
    isActive: true,
  });

  if (metadataLoading) return <Typography>Webhook metadata loading...</Typography>;

  if (metadataError) {
    return (
      <Box sx={{ width: "100%", maxWidth: 760 }}>
        <Typography variant="h5" mb={2}>Webhooks</Typography>
        <Alert severity="info">
          ユーザーWebhookは現在利用できません。管理者がWebhooksとユーザーWebhookを有効にすると設定できます。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 900, pb: 8 }}>
      <Typography variant="h5" mb={1}>Webhooks</Typography>
      <Typography color="text.secondary" mb={3}>
        自分の記事へのコメント・いいねなどを外部サービスへ通知できます。
      </Typography>

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight={600}>Configured webhooks</Typography>
            <Button startIcon={<Add />} onClick={resetEditor}>New webhook</Button>
          </Stack>
          {webhooksLoading ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : webhooks.length === 0 ? (
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
        />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="contained" disabled={savePending || !!jsonError || !event} onClick={async () => { await saveWebhook({ id: editingId, input: input() }); resetEditor(); }}>
            {editingId ? "Save changes" : "Create webhook"}
          </Button>
          <Button disabled={previewPending || !!jsonError} onClick={async () => setPreview((await previewPayload({ payloadTemplate: payload, eventType: event })).payload)}>Preview</Button>
          <Button disabled={testPending || !url || !!jsonError} onClick={async () => setTestResult(await testSend({ url, headers, payloadTemplate: payload, eventType: event }))}>Test Send</Button>
        </Stack>

        {preview !== undefined && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" mb={1}>Preview</Typography>
            <Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0 }}>{JSON.stringify(preview, null, 2)}</Box>
          </Paper>
        )}

        {testResult && <Alert severity={testResult.ok ? "success" : "warning"}>HTTP {testResult.status} / {testResult.durationMs} ms</Alert>}

        <WebhookDeliveryLog deliveries={deliveries} />
      </Stack>
    </Box>
  );
};
