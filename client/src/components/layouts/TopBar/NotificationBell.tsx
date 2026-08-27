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
import {
  useNotifications,
  type NotificationReason,
} from "../../../hooks/useNotifications";

interface NotificationBellProps {
  enabled: boolean;
}

const reasonLabels: Record<NotificationReason, string> = {
  followed_tag: "フォロー中のタグ",
  followed_user: "フォロー中のユーザー",
};

export const NotificationBell = ({ enabled }: NotificationBellProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAll,
    followBack,
    isFollowBackPending,
  } = useNotifications(enabled);

  const handleNotificationClick = async (
    notificationId: string,
    href: string | null,
  ) => {
    await markRead(notificationId);
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
    await followBack(targetUserId);
    await markRead(notificationId);
  };

  const handleDelete = async (
    event: React.MouseEvent,
    notificationId: string,
  ) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleDeleteAll = async () => {
    await deleteAll();
    setDeleteAllOpen(false);
  };

  if (!enabled) return null;

  return (
    <>
      <IconButton
        aria-label="通知"
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
            通知
          </Typography>
          {notifications.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {unreadCount > 0 ? (
                <Button size="small" onClick={() => void markAllRead()}>
                  すべて既読
                </Button>
              ) : (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setDeleteAllOpen(true)}
                >
                  すべて削除
                </Button>
              )}
            </Box>
          )}
        </Box>
        <Divider />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              通知はありません
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
                      {notification.title ?? "通知"}
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
                          <Chip size="small" label="フォロー中" />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isFollowBackPending}
                            onClick={(event) =>
                              void handleFollowBack(
                                event,
                                notification.id,
                                notification.action!.targetUserId,
                              )
                            }
                          >
                            フォローバック
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
                        {new Date(notification.created_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  <Tooltip title="通知を削除">
                    <IconButton
                      size="small"
                      aria-label="通知を削除"
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
        <DialogTitle>通知をすべて削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            既読の通知を含め、現在保存されている通知がすべて削除されます。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllOpen(false)}>キャンセル</Button>
          <Button color="error" onClick={() => void handleDeleteAll()}>
            すべて削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
