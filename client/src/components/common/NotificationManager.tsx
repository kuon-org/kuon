import { Stack, useMediaQuery } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "../../store";
import { removeNotification } from "../../store/feature/notificationSlice";
import { NotifyAlert } from "./NotifyAlert";
import type { UUID } from "../../utils/uuid";

export const NotificationManager = () => {
  const queue = useSelector((state: RootState) => state.notification.queue);
  const dispatch = useDispatch();

  const isMobile = useMediaQuery("(max-width:600px)");

  const handleClose = (id: UUID) => {
    dispatch(removeNotification(id));
  };

  const notifications = isMobile ? queue.slice(0, 1) : queue;

  return (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        zIndex: 9999,

        top: isMobile ? 16 : "auto",
        bottom: isMobile ? "auto" : 16,

        right: isMobile ? "auto" : 16,
        left: isMobile ? "50%" : "auto",
        transform: isMobile ? "translateX(-50%)" : "none",

        maxHeight: "100vh",
        overflow: "hidden",

        pointerEvents: "none",
        "& > *": { pointerEvents: "auto" },
      }}
    >
      {notifications.map((notification) => (
        <NotifyAlert
          key={notification.id}
          {...notification}
          onClose={handleClose}
        />
      ))}
    </Stack>
  );
};
