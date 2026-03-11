import { Alert, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // 追加
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

  // アニメーション終了時に親のReduxから削除
  const handleAnimationComplete = () => {
    if (!show) onClose(id);
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {show && (
        <motion.div
          // 初期状態
          initial={{ y: isMobile ? -50 : 0, x: isMobile ? 0 : 50, opacity: 0 }}
          // 表示状態
          animate={{ y: 0, x: 0, opacity: 1 }}
          // 消える時
          exit={{ y: isMobile ? -50 : 0, x: isMobile ? 0 : 50, opacity: 0 }}
          // ドラッグ設定 (スマホのみ上方向へのドラッグを許可)
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.5, bottom: 0 }} // 下方向には動かさない
          onDragEnd={(_, info) => {
            // 50px以上上にスワイプしたら消す
            if (info.offset.y < -50) {
              setShow(false);
            }
          }}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
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
              cursor: isMobile ? "grab" : "default", // 掴めることを示す
              "&:active": { cursor: isMobile ? "grabbing" : "default" },
              "& .MuiAlert-icon": { color: "inherit" },
            }}
          >
            {message}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
