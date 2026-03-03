// hooks/useNotify.ts
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "../../store/feature/notificationSlice";

export const useNotify = () => {
  const dispatch = useDispatch();

  const notify = useCallback(
    (message: string, severity: "success" | "error" | "info" = "info") => {
      dispatch(addNotification({ message, severity }));
    },
    [dispatch],
  );

  const success = useCallback(
    (message: string) => {
      notify(message, "success");
    },
    [notify],
  );

  const error = useCallback(
    (message: string) => {
      notify(message, "error");
    },
    [notify],
  );

  return { notify, success, error };
};
