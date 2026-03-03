// components/common/NotifyAlert.tsx
import { Alert, Slide } from "@mui/material";
import { useEffect, useState } from "react";
import type { UUID } from "../../utils/uuid";

interface NotifyAlertProps {
  id: UUID;
  message: string;
  severity?: "success" | "error" | "info";
  onClose: (id: UUID) => void;
}

export const NotifyAlert = ({
  id,
  message,
  severity = "info",
  onClose,
}: NotifyAlertProps) => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    // 1. 指定時間後に「閉じアニメーション」を開始させる
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  const handleExited = () => {
    onClose(id);
  };
  return (
    <Slide
      in={show}
      direction="left"
      mountOnEnter
      unmountOnExit
      onExited={handleExited}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={() => setShow(false)} // 手動で閉じるボタン
        sx={{
          width: 360,
          borderLeft: `5px solid ${severity === "error" ? "#ff1744" : "#2979ff"}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontWeight: 600,
          bgcolor: "#1a1a1a",
          color: "#fff",
          "& .MuiAlert-icon": { color: "inherit" },
        }}
      >
        {message}
      </Alert>
    </Slide>
  );
};
