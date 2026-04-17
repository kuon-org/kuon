import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  DeleteOutline as DeleteIcon,
  Add as AddIcon,
  VpnKey as KeyIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { useAuthQuery } from "../../hooks/useAuth"; // パスは環境に合わせて調整してください

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"; // 1. プラグインをインポート
import "dayjs/locale/ja"; // 2. 日本語ロケールをインポート

// 3. プラグインを有効化し、日本語に設定
dayjs.extend(relativeTime);
dayjs.locale("ja");

export const APIKeySettings = () => {
  const {
    apiKeys,
    apiKeys_isLoading,
    createApiKey,
    createApiKey_isPending,
    revokeApiKey,
    revokeApiKey_isPending,
  } = useAuthQuery();

  // ダイアログ制御用
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showKeyModalOpen, setShowKeyModalOpen] = useState(false);

  // 入力フォーム用
  const [newKeyName, setNewKeyName] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");

  // 発行された生のキーを保持（一度だけ表示するため）
  const [rawKey, setRawKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newKeyName) return;

    const expiresAt =
      expiryDays === "never"
        ? null
        : dayjs().add(Number(expiryDays), "day").toISOString();

    const result = await createApiKey({ name: newKeyName, expiresAt });

    if (result && "rawKey" in result) {
      setRawKey(result.rawKey);
      setNewKeyName("");
      setIsCreateModalOpen(false);
      setShowKeyModalOpen(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">APIキー設定</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateModalOpen(true)}
          size="small"
        >
          新しいキーを発行
        </Button>
      </Box>

      <Alert severity="info">
        APIキーを使用すると、外部アプリケーション（VSCode拡張機能など）から本システムにアクセスできます。キーの取り扱いには十分注意してください。
      </Alert>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>プレフィックス</TableCell>
              <TableCell>有効期限</TableCell>
              <TableCell>最終利用</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys?.length === 0 && !apiKeys_isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 3, color: "text.secondary" }}
                >
                  有効なAPIキーはありません
                </TableCell>
              </TableRow>
            )}
            {apiKeys?.map((key) => (
              <TableRow key={key.id}>
                <TableCell sx={{ fontWeight: "medium" }}>{key.name}</TableCell>
                <TableCell>
                  <code>{key.prefix}***</code>
                </TableCell>
                <TableCell>
                  {key.expires_at
                    ? dayjs(key.expires_at).format("YYYY/MM/DD")
                    : "無期限"}
                </TableCell>
                <TableCell
                  sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                >
                  {key.last_used_at
                    ? dayjs(key.last_used_at).fromNow()
                    : "未利用"}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="失効させる">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={revokeApiKey_isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            "このAPIキーを失効させますか？この操作は取り消せません。",
                          )
                        ) {
                          revokeApiKey(key.id);
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* キー作成ダイアログ */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>APIキーの新規発行</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="名前"
              placeholder="例: VSCode Extension"
              fullWidth
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              variant="outlined"
            />
            <TextField
              select
              label="有効期限"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              fullWidth
            >
              <MenuItem value="7">7日間</MenuItem>
              <MenuItem value="30">30日間</MenuItem>
              <MenuItem value="90">90日間</MenuItem>
              <MenuItem value="never">無期限</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCreateModalOpen(false)} color="inherit">
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newKeyName || createApiKey_isPending}
          >
            発行する
          </Button>
        </DialogActions>
      </Dialog>

      {/* キー表示ダイアログ（一度きり） */}
      <Dialog open={showKeyModalOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon color="success" /> APIキーが生成されました
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography
              variant="body2"
              color="error"
              sx={{ fontWeight: "bold" }}
            >
              このキーはセキュリティ上の理由により、二度と表示されません。
              今すぐコピーして安全な場所に保管してください。
            </Typography>
            <TextField
              fullWidth
              value={rawKey || ""}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => copyToClipboard(rawKey || "")}
                      edge="end"
                    >
                      <CopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { fontFamily: "monospace", bgcolor: "grey.50" },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setShowKeyModalOpen(false);
              setRawKey(null);
            }}
          >
            保存しました
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
