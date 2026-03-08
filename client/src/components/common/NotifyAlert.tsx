import { Alert, Slide, useMediaQuery } from "@mui/material";
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

  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleExited = () => {
    onClose(id);
  };

  return (
    <Slide
      in={show}
      direction={isMobile ? "down" : "left"} // スマホだけ上→下
      mountOnEnter
      unmountOnExit
      onExited={handleExited}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={() => setShow(false)}
        sx={{
          width: isMobile ? "90vw" : 360,
          borderLeft: `5px solid ${
            severity === "error" ? "#ff1744" : "#2979ff"
          }`,
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
