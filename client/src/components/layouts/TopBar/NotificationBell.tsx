import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useFollowBack,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useNotificationStream,
  useUnreadNotificationCountQuery,
  type NotificationReason,
} from "../../../hooks/notifications";

interface NotificationBellProps {
  enabled: boolean;
}

export const NotificationBell = ({ enabled }: NotificationBellProps) => {
  const { t, i18n } = useTranslation("notifications");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const notificationsQuery = useNotificationsQuery(enabled);
  const unreadCountQuery = useUnreadNotificationCountQuery(enabled);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const followBack = useFollowBack();
  useNotificationStream(enabled);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadCountQuery.data ?? 0;

  const reasonLabels: Record<NotificationReason, string> = {
    followed_tag: t("reasons.followedTag"),
    followed_user: t("reasons.followedUser"),
    followed_group: t("reasons.followedGroup"),
  };

  const handleNotificationClick = async (
    notificationId: string,
    href: string | null,
  ) => {
    await markRead.mutateAsync(notificationId);
    setAnchorEl(null);

    if (href) {
      window.location.assign(href);
    }
  };

  const handleFollowBack = async (
    event: React.MouseEvent,
    notificationId: string,
    targetUserId: string,
  ) => {
    event.stopPropagation();
    await followBack.mutateAsync(targetUserId);
    await markRead.mutateAsync(notificationId);
  };

  const handleDelete = async (
    event: React.MouseEvent,
    notificationId: string,
  ) => {
    event.stopPropagation();
    await deleteNotification.mutateAsync(notificationId);
  };

  const handleDeleteAll = async () => {
    await deleteAll.mutateAsync();
    setDeleteAllOpen(false);
  };

  if (!enabled) return null;

  return (
    <>
      <IconButton
        aria-label={t("ariaLabel")}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ color: "primary.contrastText" }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { width: 400, maxWidth: "calc(100vw - 24px)" } },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {t("title")}
          </Typography>
          {notifications.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {unreadCount > 0 ? (
                <Button size="small" onClick={() => void markAllRead.mutateAsync()}>
                  {t("markAllRead")}
                </Button>
              ) : (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setDeleteAllOpen(true)}
                >
                  {t("deleteAll")}
                </Button>
              )}
            </Box>
          )}
        </Box>
        <Divider />

        {notificationsQuery.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("empty")}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <Box key={notification.id}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    void handleNotificationClick(
                      notification.id,
                      notification.href,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void handleNotificationClick(
                        notification.id,
                        notification.href,
                      );
                    }
                  }}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-start",
                    bgcolor: notification.is_read
                      ? "transparent"
                      : "action.hover",
                    py: 1.5,
                    pl: 2,
                    pr: 5,
                    cursor: notification.href ? "pointer" : "default",
                    "&:hover": { bgcolor: "action.selected" },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: notification.is_read
                        ? "transparent"
                        : "primary.main",
                      mt: 0.9,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body1">
                      {notification.title ?? t("defaultTitle")}
                    </Typography>
                    {notification.message && (
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                    )}

                    {notification.reasons.length > 0 && (
                      <Stack
                        direction="row"
                        useFlexGap
                        flexWrap="wrap"
                        spacing={0.75}
                        sx={{ mt: 1 }}
                      >
                        {notification.reasons.map((reason) => (
                          <Chip
                            key={reason}
                            size="small"
                            variant="outlined"
                            label={reasonLabels[reason]}
                          />
                        ))}
                      </Stack>
                    )}

                    {notification.action?.type === "follow_back" && (
                      <Box sx={{ mt: 1 }}>
                        {notification.action.isFollowing ? (
                          <Chip size="small" label={t("following")} />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={followBack.isPending}
                            onClick={(event) =>
                              void handleFollowBack(
                                event,
                                notification.id,
                                notification.action!.targetUserId,
                              )
                            }
                          >
                            {t("followBack")}
                          </Button>
                        )}
                      </Box>
                    )}

                    {notification.created_at && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.75 }}
                      >
                        {new Intl.DateTimeFormat(i18n.language, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(notification.created_at))}
                      </Typography>
                    )}
                  </Box>

                  <Tooltip title={t("delete")}>
                    <IconButton
                      size="small"
                      aria-label={t("delete")}
                      onClick={(event) =>
                        void handleDelete(event, notification.id)
                      }
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Popover>

      <Dialog open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)}>
        <DialogTitle>{t("deleteAllDialog.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteAllDialog.description")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllOpen(false)}>
            {t("deleteAllDialog.cancel")}
          </Button>
          <Button color="error" onClick={() => void handleDeleteAll()}>
            {t("deleteAllDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
