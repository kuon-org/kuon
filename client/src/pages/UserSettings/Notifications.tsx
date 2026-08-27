import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import {
  type NotificationPreferences,
  useNotificationPreferences,
} from "../../hooks/useNotifications";

const settings: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "notifyOnArticleComment",
    label: "記事へのコメント",
    description: "自分の記事にコメントが投稿されたときに通知します。",
  },
  {
    key: "notifyOnCommentReply",
    label: "コメントへの返信",
    description: "自分のコメントに返信が投稿されたときに通知します。",
  },
  {
    key: "notifyOnFollowedTagArticle",
    label: "フォロー中タグの新着記事",
    description: "フォローしているタグが付いた記事が公開されたときに通知します。",
  },
  {
    key: "notifyOnFollowedUserArticle",
    label: "フォロー中ユーザーの新着記事",
    description: "フォローしているユーザーが記事を公開したときに通知します。",
  },
  {
    key: "notifyOnUserFollow",
    label: "ユーザーからのフォロー",
    description: "ほかのユーザーからフォローされたときに通知します。",
  },
];

export const Notifications = () => {
  const { preferences, isLoading, updatePreferences, isUpdating } =
    useNotificationPreferences();

  const update = async (
    key: keyof NotificationPreferences,
    checked: boolean,
  ) => {
    if (!preferences) return;
    await updatePreferences({ ...preferences, [key]: checked });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 760,
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>
        通知
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kuon内で受け取る通知の種類を設定します。
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {isLoading || !preferences ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            同じ記事が複数の条件に該当した場合でも、通知は1件にまとめて表示されます。
          </Alert>
          {settings.map((setting, index) => (
            <Box key={setting.key}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {setting.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {setting.description}
                  </Typography>
                </Box>
                <FormControlLabel
                  label=""
                  sx={{ m: 0 }}
                  control={
                    <Switch
                      checked={preferences[setting.key]}
                      disabled={isUpdating}
                      onChange={(event) =>
                        void update(setting.key, event.target.checked)
                      }
                    />
                  }
                />
              </Box>
              {index < settings.length - 1 && <Divider />}
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
};
