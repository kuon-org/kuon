// components/common/NotificationManager.tsx
import { Stack } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "../../store"; // あなたのストアの型
import { removeNotification } from "../../store/feature/notificationSlice";
import { NotifyAlert } from "./NotifyAlert";
import type { UUID } from "../../utils/uuid";

export const NotificationManager = () => {
  const queue = useSelector((state: RootState) => state.notification.queue);
  const dispatch = useDispatch();

  const handleClose = (id: UUID) => {
    dispatch(removeNotification(id));
  };

  return (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        // 通知が増えても画面外に突き抜けないようにする場合
        maxHeight: "100vh",
        overflow: "hidden",
        pointerEvents: "none", // 下の要素をクリックできるように
        "& > *": { pointerEvents: "auto" }, // 通知自体はクリック可能に
      }}
    >
      {queue.map((notification) => (
        <NotifyAlert
          key={notification.id}
          {...notification}
          onClose={handleClose}
        />
      ))}
    </Stack>
  );
};
