import { configureStore } from "@reduxjs/toolkit";
import notificationSlice from "./feature/notificationSlice";

const store = configureStore({
  reducer: {
    notification: notificationSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
