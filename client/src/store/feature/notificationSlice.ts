// features/notification/notificationSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { uuidv7, type UUID } from "../../utils/uuid";
export interface Notification {
  id: UUID;
  message: string;
  severity: "success" | "error" | "info";
}

interface NotificationState {
  queue: Notification[];
}

const initialState: NotificationState = {
  queue: [],
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // 通知を追加（IDはここで生成）
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id">>,
    ) => {
      const id = uuidv7();
      state.queue.push({ ...action.payload, id });
    },
    // 特定の通知を削除
    removeNotification: (state, action: PayloadAction<UUID>) => {
      state.queue = state.queue.filter((n) => n.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } =
  notificationSlice.actions;
export default notificationSlice.reducer;
