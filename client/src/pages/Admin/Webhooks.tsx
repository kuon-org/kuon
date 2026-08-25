import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Paper, Select,
  Stack, Tab, Tabs, TextField, Typography,
} from "@mui/material";
import { PayloadBuilder } from "../../components/Webhook/PayloadBuilder";
import { useWebhookAdmin, type WebhookHeader, type WebhookInput } from "../../hooks/useWebhooks";

const defaultPayload = { title: "{{article.title}}", description: "{{article.summary}}", url: "{{article.url}}" };

export const Webhooks = () => {
  const { metadata, metadataLoading, saveWebhook, savePending, previewPayload, previewPending, testSend, testPending } = useWebhookAdmin();
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [name, setName] = useState("Article published");
  const [provider, setProvider] = useState<WebhookInput["provider"]>("generic");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["article.published"]);
  const [headers, setHeaders] = useState<WebhookHeader[]>([]);
  const [payload, setPayload] = useState<unknown>(defaultPayload);
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultPayload, null, 2));
  const [jsonError, setJsonError] = useState<string>();
  const [preview, setPreview] = useState<unknown>();
  const [testResult, setTestResult] = useState<any>();

  const variables = useMemo(() => metadata?.events.find((e) => events.includes(e.type))?.variables ?? [], [metadata, events]);
  const syncPayload = (value: unknown) => { setPayload(value); setJsonText(JSON.stringify(value, null, 2)); setJsonError(undefined); };
  const applyJson = (text: string) => {
    setJsonText(text);
    try { const parsed = JSON.parse(text); setPayload(parsed); setJsonError(undefined); }
    catch (error) { setJsonError(error instanceof Error ? error.message : "Invalid JSON"); }
  };
  const applyPreset = (id: string) => {
    const preset = metadata?.presets.find((p) => p.id === id);
    if (!preset) return;
    setProvider(preset.provider); syncPayload(preset.payloadTemplate);
  };
  const input = (): WebhookInput => ({ name, scope: "system", provider, url, httpMethod: "POST", payloadTemplate: payload, events, headers });

  if (metadataLoading) return <Typography>Webhook metadata loading...</Typography>;
  return (
    <Box sx={{ width: "100%", maxWidth: 980, pb: 8 }}>
      <Typography variant="h5" mb={1}>Webhooks</Typography>
      <Typography color="text.secondary" mb={3}>イベント通知の送信先とJSON Payloadを設定します。Visual BuilderとRaw JSONは同じPayloadを編集します。</Typography>
      <Stack spacing={2}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Webhook URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Select value={provider} onChange={(e) => setProvider(e.target.value as WebhookInput["provider"])} sx={{ minWidth: 180 }}><MenuItem value="generic">Generic</MenuItem><MenuItem value="discord">Discord</MenuItem><MenuItem value="slack">Slack</MenuItem><MenuItem value="teams">Microsoft Teams</MenuItem></Select>
          <Select displayEmpty value="" onChange={(e) => { applyPreset(e.target.value); }} sx={{ minWidth: 240 }}><MenuItem value="" disabled>Apply template...</MenuItem>{metadata?.presets.map((preset) => <MenuItem key={preset.id} value={preset.id}>{preset.label}</MenuItem>)}</Select>
        </Stack>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" mb={1}>Events</Typography>
          {metadata?.events.map((event) => <FormControlLabel key={event.type} control={<Checkbox checked={events.includes(event.type)} onChange={(e) => setEvents(e.target.checked ? [...events, event.type] : events.filter((v) => v !== event.type))} />} label={event.label ?? event.type} />)}
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2">Headers</Typography><Button onClick={() => setHeaders([...headers, { name: "", value: "" }])}>+ Header</Button></Stack>
          <Stack spacing={1} mt={1}>{headers.map((header, index) => <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1}><TextField size="small" label="Name" value={header.name} onChange={(e) => { const next=[...headers]; next[index]={...header,name:e.target.value}; setHeaders(next); }} /><TextField size="small" label="Value" type={header.isSecret ? "password" : "text"} value={header.value} onChange={(e) => { const next=[...headers]; next[index]={...header,value:e.target.value}; setHeaders(next); }} sx={{ flex:1 }} /><FormControlLabel control={<Checkbox checked={header.isSecret ?? false} onChange={(e) => { const next=[...headers]; next[index]={...header,isSecret:e.target.checked}; setHeaders(next); }} />} label="Secret" /><Button color="error" onClick={() => setHeaders(headers.filter((_,i)=>i!==index))}>Delete</Button></Stack>)}</Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 2 }}><Tab value="builder" label="Visual Builder" /><Tab value="json" label="JSON" /></Tabs>
          {mode === "builder" ? <PayloadBuilder value={payload} variables={variables} onChange={syncPayload} /> : <><TextField multiline minRows={16} fullWidth value={jsonText} onChange={(e) => applyJson(e.target.value)} error={!!jsonError} helperText={jsonError ?? "{{article.title}} などのKuon variableを利用できます"} inputProps={{ style: { fontFamily: "monospace" } }} /></>}
        </Paper>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" disabled={!!jsonError || previewPending} onClick={async () => setPreview((await previewPayload(payload)).payload)}>Preview</Button>
          <Button variant="outlined" disabled={!url || !!jsonError || testPending} onClick={async () => setTestResult(await testSend({ url, headers, payloadTemplate: payload }))}>Test Send</Button>
          <Button variant="contained" disabled={!url || !name || events.length === 0 || !!jsonError || savePending} onClick={async () => { await saveWebhook({ input: input() }); }}>Save</Button>
        </Stack>
        {preview !== undefined && <Paper variant="outlined" sx={{ p:2 }}><Typography variant="subtitle2" mb={1}>Preview</Typography><Box component="pre" sx={{ m:0, overflow:"auto", whiteSpace:"pre-wrap" }}>{JSON.stringify(preview,null,2)}</Box></Paper>}
        {testResult && <Alert severity={testResult.ok ? "success" : "warning"}>Test Send: HTTP {testResult.status ?? "-"} / {testResult.durationMs ?? "-"}ms</Alert>}
      </Stack>
    </Box>
  );
};
