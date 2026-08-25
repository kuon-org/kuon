import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  usePublishWebhooks,
  type PublishWebhookOption,
} from "../../hooks/usePublishWebhooks";

export const PUBLISH_WEBHOOK_NOTIFY_KEY = "kuon.publishWebhooks.notify";
export const PUBLISH_WEBHOOK_IDS_KEY = "kuon.publishWebhooks.ids";

export const getPublishWebhookPreference = () => {
  const notify = localStorage.getItem(PUBLISH_WEBHOOK_NOTIFY_KEY) === "true";
  let webhookIds: string[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(PUBLISH_WEBHOOK_IDS_KEY) ?? "[]");
    if (Array.isArray(parsed)) {
      webhookIds = parsed.filter((value): value is string => typeof value === "string");
    }
  } catch {
    webhookIds = [];
  }
  return { notify, webhookIds };
};

const providerLabel: Record<PublishWebhookOption["provider"], string> = {
  generic: "Generic",
  discord: "Discord",
  slack: "Slack",
  teams: "Microsoft Teams",
};

export const PublishWebhookSettings = ({ disabled = false }: { disabled?: boolean }) => {
  const { data: options = [], isLoading } = usePublishWebhooks();
  const initial = useMemo(() => getPublishWebhookPreference(), []);
  const [notify, setNotify] = useState(initial.notify);
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.webhookIds);

  const selected = options.filter((option) => selectedIds.includes(option.id));

  useEffect(() => {
    if (isLoading) return;
    const validIds = selectedIds.filter((id) => options.some((option) => option.id === id));
    if (validIds.length !== selectedIds.length) {
      setSelectedIds(validIds);
      localStorage.setItem(PUBLISH_WEBHOOK_IDS_KEY, JSON.stringify(validIds));
    }
  }, [isLoading, options, selectedIds]);

  const changeNotify = (checked: boolean) => {
    setNotify(checked);
    localStorage.setItem(PUBLISH_WEBHOOK_NOTIFY_KEY, String(checked));
  };

  const changeTargets = (values: PublishWebhookOption[]) => {
    const ids = values.map((value) => value.id);
    setSelectedIds(ids);
    localStorage.setItem(PUBLISH_WEBHOOK_IDS_KEY, JSON.stringify(ids));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Webhook通知
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        公開時に選択した通知先へ記事情報を送信します。この設定はブラウザに保存されます。
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={notify}
            disabled={disabled || options.length === 0}
            onChange={(_, checked) => changeNotify(checked)}
          />
        }
        label="Webhookで通知する"
      />
      {options.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 1 }}>
          利用可能なWebhook通知先がありません。管理者がWebhookを有効化・設定すると選択できます。
        </Alert>
      )}
      {notify && options.length > 0 && (
        <Autocomplete
          multiple
          sx={{ mt: 1 }}
          options={options}
          value={selected}
          getOptionLabel={(option) => `${option.name} (${providerLabel[option.provider]})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, values) => changeTargets(values)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="通知先"
              placeholder="通知先チャネルを選択"
              helperText="複数選択できます"
            />
          )}
        />
      )}
      {notify && options.length > 0 && selected.length === 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          通知がONですが通知先が選択されていません。このままでは通知されません。
        </Alert>
      )}
    </Box>
  );
};
