import { useEffect, useRef, useState } from "react";
import { Box, Button } from "@mui/material";
import { createDrawioLoadXml } from "../../utils/drawio";
import { ZoomableContent } from "../common/ZoomableContent";

interface DrawioRendererProps {
  data: string;
  onEdit?: (data: string) => void;
}

const DRAWIO_ORIGIN = "https://embed.diagrams.net";
const DRAWIO_SRC =
  `${DRAWIO_ORIGIN}/?embed=1&ui=atlas&spin=1&proto=json` +
  "&noSaveBtn=1&noExitBtn=1";

export const DrawioRenderer = ({ data, onEdit }: DrawioRendererProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    setSvg(null);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== DRAWIO_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (typeof event.data !== "string") return;

      let message: any;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      const win = iframeRef.current?.contentWindow;
      if (!win) return;

      if (message.event === "init") {
        win.postMessage(
          JSON.stringify({
            action: "load",
            xml: createDrawioLoadXml(data),
            autosave: 0,
            noSaveBtn: 1,
            noExitBtn: 1,
            fit: 1,
            border: 0,
          }),
          DRAWIO_ORIGIN,
        );
        return;
      }

      if (message.event === "load") {
        win.postMessage(
          JSON.stringify({
            action: "export",
            format: "svg",
            border: 0,
            fit: 1,
          }),
          DRAWIO_ORIGIN,
        );
        return;
      }

      if (message.event === "export" && message.format === "svg") {
        const value = typeof message.data === "string" ? message.data : "";
        if (value.startsWith("data:image/svg+xml")) {
          setSvg(value);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [data]);

  return (
    <Box
      sx={{
        my: 2,
        position: "relative",
        "&:hover .edit-btn": {
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <iframe
          ref={iframeRef}
          src={DRAWIO_SRC}
          title="Draw.io renderer"
          style={{ width: 1, height: 1, border: "none" }}
        />
      </Box>

      {svg ? (
        <ZoomableContent>
          <Box
            component="img"
            src={svg}
            alt="drawio"
            sx={{ display: "block", maxWidth: "100%", height: "auto" }}
          />
        </ZoomableContent>
      ) : (
        <Box sx={{ minHeight: 80 }} />
      )}

      {onEdit && (
        <Button
          className="edit-btn"
          variant="outlined"
          color="inherit"
          size="small"
          onClick={() => onEdit(data)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            opacity: 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          編集
        </Button>
      )}
    </Box>
  );
};
