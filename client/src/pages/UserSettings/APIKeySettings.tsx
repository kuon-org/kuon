import { Alert, Box, Button, IconButton, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from "@mui/material";
import { ContentCopy as CopyIcon, DeleteOutline as DeleteIcon, Add as AddIcon, VpnKey as KeyIcon } from "@mui/icons-material";
import { useState } from "react";
import { useAuthQuery } from "../../hooks/useAuth";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ja";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

export const APIKeySettings = () => {
  const { t, i18n } = useTranslation("settings");
  const { apiKeys, apiKeys_isLoading, createApiKey, createApiKey_isPending, revokeApiKey, revokeApiKey_isPending } = useAuthQuery();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showKeyModalOpen, setShowKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const locale = i18n.language.toLowerCase().startsWith("ja") ? "ja" : "en";
  const dateFormatter = new Intl.DateTimeFormat(i18n.language);

  const handleCreate = async () => {
    if (!newKeyName) return;
    const expiresAt = expiryDays === "never" ? null : dayjs().add(Number(expiryDays), "day").toISOString();
    const result = await createApiKey({ name: newKeyName, expiresAt });
    if (result && "rawKey" in result) {
      setRawKey(result.rawKey); setNewKeyName(""); setIsCreateModalOpen(false); setShowKeyModalOpen(true);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">{t("apiKeys.title")}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreateModalOpen(true)} size="small">{t("apiKeys.create")}</Button>
      </Box>
      <Alert severity="info">{t("apiKeys.info")}</Alert>
      <TableContainer><Table size="small"><TableHead><TableRow><TableCell>{t("apiKeys.columns.name")}</TableCell><TableCell>{t("apiKeys.columns.prefix")}</TableCell><TableCell>{t("apiKeys.columns.expiresAt")}</TableCell><TableCell>{t("apiKeys.columns.lastUsedAt")}</TableCell><TableCell align="right" /></TableRow></TableHead><TableBody>
        {apiKeys?.length === 0 && !apiKeys_isLoading && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>{t("apiKeys.empty")}</TableCell></TableRow>}
        {apiKeys?.map((key) => <TableRow key={key.id}><TableCell sx={{ fontWeight: "medium" }}>{key.name}</TableCell><TableCell><code>{key.prefix}***</code></TableCell><TableCell>{key.expires_at ? dateFormatter.format(new Date(key.expires_at)) : t("apiKeys.neverExpires")}</TableCell><TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{key.last_used_at ? dayjs(key.last_used_at).locale(locale).fromNow() : t("apiKeys.neverUsed")}</TableCell><TableCell align="right"><Tooltip title={t("apiKeys.revoke")}><IconButton size="small" color="error" disabled={revokeApiKey_isPending} onClick={() => { if (window.confirm(t("apiKeys.revokeConfirm"))) revokeApiKey(key.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>)}
      </TableBody></Table></TableContainer>
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} fullWidth maxWidth="xs"><DialogTitle>{t("apiKeys.dialog.title")}</DialogTitle><DialogContent><Stack spacing={3} sx={{ mt: 1 }}><TextField label={t("apiKeys.dialog.name")} placeholder={t("apiKeys.dialog.namePlaceholder")} fullWidth value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} /><TextField select label={t("apiKeys.dialog.expiresAt")} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} fullWidth><MenuItem value="7">{t("apiKeys.dialog.days", { count: 7 })}</MenuItem><MenuItem value="30">{t("apiKeys.dialog.days", { count: 30 })}</MenuItem><MenuItem value="90">{t("apiKeys.dialog.days", { count: 90 })}</MenuItem><MenuItem value="never">{t("apiKeys.neverExpires")}</MenuItem></TextField></Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setIsCreateModalOpen(false)} color="inherit">{t("common.cancel")}</Button><Button variant="contained" onClick={handleCreate} disabled={!newKeyName || createApiKey_isPending}>{t("apiKeys.dialog.issue")}</Button></DialogActions></Dialog>
      <Dialog open={showKeyModalOpen} maxWidth="sm" fullWidth><DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}><KeyIcon color="success" /> {t("apiKeys.generated.title")}</DialogTitle><DialogContent><Stack spacing={2}><Typography variant="body2" color="error" sx={{ fontWeight: "bold" }}>{t("apiKeys.generated.warning")}</Typography><TextField fullWidth value={rawKey || ""} InputProps={{ readOnly: true, endAdornment: <InputAdornment position="end"><IconButton onClick={() => navigator.clipboard.writeText(rawKey || "")} edge="end"><CopyIcon /></IconButton></InputAdornment>, sx: { fontFamily: "monospace", bgcolor: "grey.50" } }} /></Stack></DialogContent><DialogActions sx={{ p: 3 }}><Button variant="contained" fullWidth onClick={() => { setShowKeyModalOpen(false); setRawKey(null); }}>{t("apiKeys.generated.saved")}</Button></DialogActions></Dialog>
    </Stack>
  );
};
