// components/MarkdownEditor/DrawioEditor.tsx
import { Dialog, DialogContent } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import { createDrawioLoadXml, encodeDrawio } from "../../utils/drawio";

interface DrawioEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: string) => void;
  initialData?: string;
}

export const DrawioEditor = ({
  open,
  onClose,
  onSave,
  initialData,
}: DrawioEditorProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const closeAfterExportRef = useRef(false);

  const sendLoadAction = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    const xmlToSend = initialData ? createDrawioLoadXml(initialData) : "";

    win.postMessage(
      JSON.stringify({
        action: "load",
        xml: xmlToSend,
        autosave: 1,
      }),
      "https://embed.diagrams.net",
    );
  }, [initialData]);

  const requestExport = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    win.postMessage(
      JSON.stringify({
        action: "export",
        format: "xml",
      }),
      "https://embed.diagrams.net",
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleMessage = (res: MessageEvent) => {
      if (res.origin !== "https://embed.diagrams.net") return;
      if (res.source !== iframeRef.current?.contentWindow) return;
      if (!res.data || typeof res.data !== "string") return;

      let msg: any;
      try {
        msg = JSON.parse(res.data);
      } catch {
        return;
      }

      if (msg.event === "init") {
        closeAfterExportRef.current = false;
        sendLoadAction();
        return;
      }

      if (msg.event === "save") {
        closeAfterExportRef.current = true;
        requestExport();
        return;
      }

      if (msg.event === "exit") {
        onClose();
        return;
      }

      if (msg.event === "export") {
        const xml = typeof msg.xml === "string" ? msg.xml : "";
        if (!xml) return;

        onSave(encodeDrawio(xml));

        if (closeAfterExportRef.current) {
          onClose();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [open, onClose, onSave, requestExport, sendLoadAction]);

  if (!open) return null;

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json"
          title="Draw.io editor"
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </DialogContent>
    </Dialog>
  );
};
