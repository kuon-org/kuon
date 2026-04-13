import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  type ErrorComponentProps,
  useRouter,
  Link,
} from "@tanstack/react-router";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {
  getErrorStatus,
  isForbidden,
  isNotFound,
  isUnauthorized,
} from "../../utils/errorHelpers";

export const GlobalErrorComponent = ({ error, reset }: ErrorComponentProps) => {
  const router = useRouter();
  const status = getErrorStatus(error);

  const handleRetry = () => {
    // 状態をリセットして現在のルートを再検証
    reset();
    router.invalidate();
  };

  // デフォルト設定
  let title = "問題が発生しました";
  let description =
    "アプリケーションの読み込み中に予期しないエラーが発生しました。";
  let icon = (
    <WarningAmberIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
  );
  let showRetry = true;

  // ステータスに応じた表示の切り替え
  if (isForbidden(error)) {
    title = "アクセス権限がありません";
    description = "この操作を行う権限がないか、閲覧が制限されています。";
    icon = (
      <LockPersonIcon sx={{ fontSize: 60, color: "warning.main", mb: 2 }} />
    );
    showRetry = false; // 権限エラーはリトライしても解決しないことが多いため
  } else if (isNotFound(error)) {
    title = "データが見つかりませんでした";
    description =
      "リクエストされたリソースは存在しないか、削除された可能性があります。";
    icon = (
      <SearchOffIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
    );
    showRetry = false;
  } else if (isUnauthorized(error)) {
    title = "認証エラー";
    description =
      "セッションが切れた可能性があります。再度ログインしてください。";
    showRetry = false;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8, textAlign: "center" }}>
        {icon}
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: "500px", mx: "auto" }}
        >
          {description}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 6 }}>
          {showRetry && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleRetry}
            >
              再試行する
            </Button>
          )}
          <Button variant="contained" component={Link} to="/" size="large">
            トップへ戻る
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ textAlign: "left", mt: 4 }}>
          <Accordion elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="caption"
                color="error"
                sx={{ fontWeight: "bold" }}
              >
                エラーの詳細情報 (Status: {status ?? "Unknown"})
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                {error instanceof Error
                  ? error.message
                  : JSON.stringify(error, null, 2)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Container>
  );
};
