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
import { useTranslation } from "react-i18next";
import {
  usePublishWebhookOptionsQuery,
  type PublishWebhookOption,
} from "../../hooks/webhooks";

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
  const { t } = useTranslation("articles");
  const publishWebhooksQuery = usePublishWebhookOptionsQuery();
  const options = publishWebhooksQuery.data ?? [];
  const isLoading = publishWebhooksQuery.isLoading;
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
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{t("editor.webhook.title")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t("editor.webhook.description")}</Typography>
      <FormControlLabel
        control={<Switch checked={notify} disabled={disabled || options.length === 0} onChange={(_, checked) => changeNotify(checked)} />}
        label={t("editor.webhook.enable")}
      />
      {options.length === 0 && !isLoading && <Alert severity="info" sx={{ mt: 1 }}>{t("editor.webhook.noTargets")}</Alert>}
      {notify && options.length > 0 && (
        <Autocomplete
          multiple
          sx={{ mt: 1 }}
          options={options}
          value={selected}
          getOptionLabel={(option) => `${option.name} (${providerLabel[option.provider]})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, values) => changeTargets(values)}
          renderInput={(params) => <TextField {...params} label={t("editor.webhook.targets")} placeholder={t("editor.webhook.targetPlaceholder")} helperText={t("editor.webhook.multiple")} />}
        />
      )}
      {notify && options.length > 0 && selected.length === 0 && <Alert severity="warning" sx={{ mt: 1 }}>{t("editor.webhook.noSelection")}</Alert>}
    </Box>
  );
};
