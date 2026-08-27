import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNavigate } from "@tanstack/react-router";
import { useNotifications } from "../../../hooks/useNotifications";

interface NotificationBellProps {
  enabled: boolean;
}

export const NotificationBell = ({ enabled }: NotificationBellProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications(enabled);

  const handleNotificationClick = async (notificationId: string, href: string | null) => {
    await markRead(notificationId);
    setAnchorEl(null);

    if (href) {
      window.location.assign(href);
    }
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
        slotProps={{ paper: { sx: { width: 360, maxWidth: "calc(100vw - 24px)" } } }}
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
          {unreadCount > 0 && (
            <Button size="small" onClick={() => void markAllRead()}>
              すべて既読
            </Button>
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
                <ListItemButton
                  onClick={() =>
                    void handleNotificationClick(notification.id, notification.href)
                  }
                  sx={{
                    alignItems: "flex-start",
                    bgcolor: notification.is_read ? "transparent" : "action.hover",
                    py: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: notification.is_read ? "transparent" : "primary.main",
                      mt: 0.9,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={notification.title ?? "通知"}
                    secondary={
                      <>
                        {notification.message && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {notification.message}
                          </Typography>
                        )}
                        {notification.created_at && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {new Date(notification.created_at).toLocaleString()}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItemButton>
                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};
