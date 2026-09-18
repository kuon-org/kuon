import { Alert, Box, CircularProgress, Divider, FormControlLabel, Paper, Switch, Typography } from "@mui/material";
import {
  type NotificationPreferences,
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferences,
} from "../../hooks/notifications";
import { useTranslation } from "react-i18next";

export const Notifications = () => {
  const { t } = useTranslation("settings");
  const preferencesQuery = useNotificationPreferencesQuery();
  const updatePreferences = useUpdateNotificationPreferences();
  const preferences = preferencesQuery.data;
  const settings: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
    { key: "notifyOnArticleComment", label: t("notifications.articleComment.label"), description: t("notifications.articleComment.description") },
    { key: "notifyOnCommentReply", label: t("notifications.commentReply.label"), description: t("notifications.commentReply.description") },
    { key: "notifyOnFollowedTagArticle", label: t("notifications.followedTagArticle.label"), description: t("notifications.followedTagArticle.description") },
    { key: "notifyOnFollowedUserArticle", label: t("notifications.followedUserArticle.label"), description: t("notifications.followedUserArticle.description") },
    { key: "notifyOnFollowedGroupArticle", label: t("notifications.followedGroupArticle.label"), description: t("notifications.followedGroupArticle.description") },
    { key: "notifyOnUserFollow", label: t("notifications.userFollow.label"), description: t("notifications.userFollow.description") },
  ];
  const update = async (key: keyof NotificationPreferences, checked: boolean) => {
    if (preferences) await updatePreferences.mutateAsync({ ...preferences, [key]: checked });
  };

  return (
    <Paper elevation={0} sx={{ width: "100%", maxWidth: 760, p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{t("notifications.title")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t("notifications.description")}</Typography>
      <Divider sx={{ mb: 3 }} />
      {preferencesQuery.isLoading || !preferences ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box> : (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>{t("notifications.dedupeInfo")}</Alert>
          {settings.map((setting, index) => (
            <Box key={setting.key}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 1.5 }}>
                <Box><Typography variant="subtitle1" fontWeight={600}>{setting.label}</Typography><Typography variant="body2" color="text.secondary">{setting.description}</Typography></Box>
                <FormControlLabel label="" sx={{ m: 0 }} control={<Switch checked={preferences[setting.key]} disabled={updatePreferences.isPending} onChange={(event) => void update(setting.key, event.target.checked)} />} />
              </Box>
              {index < settings.length - 1 && <Divider />}
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
};
