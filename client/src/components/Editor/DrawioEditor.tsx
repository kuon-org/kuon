// components/MarkdownEditor/DrawioEditor.tsx
import { Dialog, DialogContent } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";

interface DrawioEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (base64: string) => void;
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

  const normalizeBase64 = (s: string) =>
    s
      .trim()
      .replace(/\s/g, "")
      .replace(/^data:image\/svg\+xml;base64,/, "");

  const sendLoadAction = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    let xmlToSend = "";
    if (initialData) {
      const clean = normalizeBase64(initialData);
      // SVG DataURL として読み込み（あなたの保存形式に合わせる）
      xmlToSend = `data:image/svg+xml;base64,${clean}`;
    }

    // proto=json の場合、init の後に load を送るのが基本フロー [1](https://www.drawio.com/doc/faq/embed-mode)[3](https://deepwiki.com/jgraph/drawio-integration/2.2-integration-protocol)
    win.postMessage(
      JSON.stringify({
        action: "load",
        xml: xmlToSend,
        autosave: 1,
      }),
      "*",
    );
  }, [initialData]);

  const requestExport = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;

    win.postMessage(
      JSON.stringify({
        action: "export",
        format: "xmlsvg",
        base64: true,
        xml: null,
      }),
      "*",
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleMessage = (res: MessageEvent) => {
      // 本番は origin チェック推奨（embed.diagrams.net 以外を弾く） [1](https://www.drawio.com/doc/faq/embed-mode)
      // if (res.origin !== "https://embed.diagrams.net") return;

      if (!res.data || typeof res.data !== "string") return;

      let msg: any;
      try {
        msg = JSON.parse(res.data);
      } catch {
        return;
      }

      // 準備完了 → load を送る [1](https://www.drawio.com/doc/faq/embed-mode)[3](https://deepwiki.com/jgraph/drawio-integration/2.2-integration-protocol)
      if (msg.event === "init") {
        closeAfterExportRef.current = false;
        sendLoadAction();
        return;
      }

      // draw.io 側の「保存」 → host が export を要求するのが定石 [2](https://www.drawio.com/blog/embedding-walkthrough)[3](https://deepwiki.com/jgraph/drawio-integration/2.2-integration-protocol)
      if (msg.event === "save") {
        closeAfterExportRef.current = true; // 保存のときは export 後に閉じる
        requestExport();
        return;
      }

      // draw.io 側の「終了」 → 何も反映せず閉じる
      if (msg.event === "exit") {
        onClose();
        return;
      }

      // export 結果受領 → 反映 →（保存由来なら）閉じる [2](https://www.drawio.com/blog/embedding-walkthrough)[3](https://deepwiki.com/jgraph/drawio-integration/2.2-integration-protocol)
      if (msg.event === "export") {
        const raw = typeof msg.data === "string" ? msg.data : "";
        const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
        onSave(normalizeBase64(b64));

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
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </DialogContent>
    </Dialog>
  );
};
