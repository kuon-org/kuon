import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  useStorageSettingsQuery,
  useUpdateStorageSettings,
  type StorageDeliveryMode,
  type StorageProvider,
} from "../../hooks/storage";

export const StorageSettingsSection = () => {
  const settingsQuery = useStorageSettingsQuery();
  const updateSettings = useUpdateStorageSettings();
  const settings = settingsQuery.data;

  const [provider, setProvider] = useState<StorageProvider>("local");
  const [deliveryMode, setDeliveryMode] =
    useState<StorageDeliveryMode>("relay");
  const [signedUrlExpiresInSeconds, setSignedUrlExpiresInSeconds] =
    useState("300");
  const [localPath, setLocalPath] = useState("");
  const [s3Endpoint, setS3Endpoint] = useState("");
  const [s3Region, setS3Region] = useState("auto");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3AccessKeyId, setS3AccessKeyId] = useState("");
  const [s3SecretAccessKey, setS3SecretAccessKey] = useState("");
  const [s3ForcePathStyle, setS3ForcePathStyle] = useState(false);
  const [azureAccountName, setAzureAccountName] = useState("");
  const [azureAccountKey, setAzureAccountKey] = useState("");
  const [azureContainer, setAzureContainer] = useState("");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider);
    setDeliveryMode(settings.deliveryMode);
    setSignedUrlExpiresInSeconds(String(settings.signedUrlExpiresInSeconds));
    setLocalPath(settings.localPath);
    setS3Endpoint(settings.s3.endpoint);
    setS3Region(settings.s3.region);
    setS3Bucket(settings.s3.bucket);
    setS3AccessKeyId(settings.s3.accessKeyId);
    setS3SecretAccessKey("");
    setS3ForcePathStyle(settings.s3.forcePathStyle);
    setAzureAccountName(settings.azure.accountName);
    setAzureAccountKey("");
    setAzureContainer(settings.azure.container);
    setAzureEndpoint(settings.azure.endpoint);
  }, [settings]);

  const readOnly = settings?.readOnly ?? false;

  const handleProviderChange = (nextProvider: StorageProvider) => {
    setProvider(nextProvider);
    if (nextProvider === "local" && deliveryMode === "redirect") {
      setDeliveryMode("relay");
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await updateSettings.mutateAsync({
        provider,
        deliveryMode,
        signedUrlExpiresInSeconds: Number(signedUrlExpiresInSeconds),
        localPath,
        s3: {
          endpoint: s3Endpoint,
          region: s3Region,
          bucket: s3Bucket,
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey || undefined,
          forcePathStyle: s3ForcePathStyle,
        },
        azure: {
          accountName: azureAccountName,
          accountKey: azureAccountKey || undefined,
          container: azureContainer,
          endpoint: azureEndpoint,
        },
      });
      setS3SecretAccessKey("");
      setAzureAccountKey("");
      setMessage("Storage設定を保存しました");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Storage設定の保存に失敗しました",
      );
    }
  };

  if (settingsQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        File Storage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        アップロードファイルの保存先と配信方式を設定します。Providerを変更しても既存ファイルは自動移行されないため、移行時はBackup
        / Restoreを利用してください。
      </Typography>
      {readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Source: Environment —
          Storage関連の環境変数が設定されているため、この画面では読み取り専用です。
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <FormControl fullWidth disabled={readOnly}>
          <InputLabel>Storage Provider</InputLabel>
          <Select
            label="Storage Provider"
            value={provider}
            onChange={(event) =>
              handleProviderChange(event.target.value as StorageProvider)
            }
          >
            <MenuItem value="local">Local filesystem</MenuItem>
            <MenuItem value="s3">S3-compatible</MenuItem>
            <MenuItem value="azure">Azure Blob Storage</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={readOnly}>
          <InputLabel>Delivery Mode</InputLabel>
          <Select
            label="Delivery Mode"
            value={deliveryMode}
            onChange={(event) =>
              setDeliveryMode(event.target.value as StorageDeliveryMode)
            }
          >
            <MenuItem value="relay">Relay</MenuItem>
            <MenuItem value="redirect" disabled={provider === "local"}>
              Redirect (signed URL)
            </MenuItem>
          </Select>
        </FormControl>

        {deliveryMode === "redirect" && (
          <TextField
            label="Signed URL expires in (seconds)"
            type="number"
            value={signedUrlExpiresInSeconds}
            onChange={(event) =>
              setSignedUrlExpiresInSeconds(event.target.value)
            }
            inputProps={{ min: 1, max: 604800 }}
            disabled={readOnly}
            fullWidth
          />
        )}

        {provider === "local" && (
          <TextField
            label="Local storage path"
            value={localPath}
            onChange={(event) => setLocalPath(event.target.value)}
            disabled={readOnly}
            fullWidth
          />
        )}

        {provider === "s3" && (
          <>
            <TextField
              label="Endpoint"
              value={s3Endpoint}
              onChange={(event) => setS3Endpoint(event.target.value)}
              disabled={readOnly}
              helperText="AWS S3では空欄。R2 / MOS3 / その他S3互換Storageではendpointを指定します。"
              fullWidth
            />
            <TextField
              label="Region"
              value={s3Region}
              onChange={(event) => setS3Region(event.target.value)}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Bucket"
              value={s3Bucket}
              onChange={(event) => setS3Bucket(event.target.value)}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Access Key ID"
              value={s3AccessKeyId}
              onChange={(event) => setS3AccessKeyId(event.target.value)}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Secret Access Key"
              type="password"
              value={s3SecretAccessKey}
              onChange={(event) => setS3SecretAccessKey(event.target.value)}
              placeholder={
                settings?.s3.secretAccessKeyConfigured ? "設定済み" : ""
              }
              helperText={
                settings?.s3.secretAccessKeyConfigured
                  ? "空欄のまま保存すると現在のSecretを維持します。"
                  : undefined
              }
              disabled={readOnly}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={s3ForcePathStyle}
                  onChange={(event) =>
                    setS3ForcePathStyle(event.target.checked)
                  }
                  disabled={readOnly}
                />
              }
              label="Force path-style access"
            />
          </>
        )}

        {provider === "azure" && (
          <>
            <TextField
              label="Account Name"
              value={azureAccountName}
              onChange={(event) => setAzureAccountName(event.target.value)}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Account Key"
              type="password"
              value={azureAccountKey}
              onChange={(event) => setAzureAccountKey(event.target.value)}
              placeholder={
                settings?.azure.accountKeyConfigured ? "設定済み" : ""
              }
              helperText={
                settings?.azure.accountKeyConfigured
                  ? "空欄のまま保存すると現在のAccount Keyを維持します。"
                  : undefined
              }
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Container"
              value={azureContainer}
              onChange={(event) => setAzureContainer(event.target.value)}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Endpoint"
              value={azureEndpoint}
              onChange={(event) => setAzureEndpoint(event.target.value)}
              disabled={readOnly}
              helperText="Azure Blob Storageでは空欄。Azurite等を利用する場合に指定します。"
              fullWidth
            />
          </>
        )}

        {!readOnly && (
          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              Storage設定を保存
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
};
