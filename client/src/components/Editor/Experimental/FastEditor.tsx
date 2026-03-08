// FastEditor.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { FastEditorCore, type FastEditorCoreOptions } from "./FastEditorCore";

export interface FastEditorProps {
  initialValue?: string; // 初期値のみ（購読しない）
  onChange: (text: string) => void; // デバウンス後に発火
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onFilesDropped?: (files: FileList, e: DragEvent) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number; // 既定 500ms
}

export interface FastEditorRef {
  // 読み書き（プログラム反映／別記事読み込み時など）
  setValue: (text: string) => void;
  getValue: () => string;
  focus: () => void;
  flush: () => void; // 今すぐ onChange（state）に流す

  // 挿入アクション
  insertText: (text: string) => void;
  surroundSelection: (prefix: string, suffix: string) => void;
  insertBlock: (block: string, surroundWithNewlines?: boolean) => void;
  undo: () => void;
  redo: () => void;

  // Drawio 置換
  replaceDrawioByBase64: (base64: string, newBlock: string) => boolean;
}

const FastEditor = forwardRef<FastEditorRef, FastEditorProps>(
  (
    {
      initialValue,
      onChange,
      onScroll,
      onFilesDropped,
      placeholder,
      className,
      debounceMs = 500,
    },
    ref,
  ) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const coreRef = useRef<FastEditorCore | null>(null);

    // デバウンス用
    const timerRef = useRef<number | null>(null);
    const lastMdRef = useRef<string>("");

    const scheduleDebouncedEmit = (md: string) => {
      lastMdRef.current = md;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        // 可能なら idle で
        const run = () => onChange(lastMdRef.current);
        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(run, { timeout: 250 });
        } else {
          run();
        }
        timerRef.current = null;
      }, debounceMs);
    };

    const flush = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const md = coreRef.current?.getValue() ?? "";
      onChange(md);
    };

    // 初期化/破棄
    useLayoutEffect(() => {
      if (!hostRef.current) return;
      const opts: FastEditorCoreOptions = {
        placeholder,
        onChange: (md) => {
          // タイピング中は即時に親へ流さず、500ms デバウンスでまとめて通知
          scheduleDebouncedEmit(md);
        },
        onScroll: (ev) =>
          onScroll?.(ev as unknown as React.UIEvent<HTMLDivElement>),
        onFilesDropped: (files, ev) => onFilesDropped?.(files, ev),
      };
      const core = new FastEditorCore(hostRef.current, opts);
      coreRef.current = core;
      if (initialValue != null) core.setValue(initialValue);

      // blur/visibilitychange で保険的に flush（任意）
      const onBlur = () => flush();
      const onVis = () => {
        if (document.visibilityState === "hidden") flush();
      };
      hostRef.current.addEventListener("blur", onBlur, true);
      document.addEventListener("visibilitychange", onVis);

      return () => {
        coreRef.current?.destroy();
        coreRef.current = null;
        hostRef.current?.removeEventListener("blur", onBlur, true);
        document.removeEventListener("visibilitychange", onVis);
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      setValue: (text) => coreRef.current?.setValue(text ?? ""),
      getValue: () => coreRef.current?.getValue() ?? "",
      focus: () => coreRef.current?.focus(),
      flush,

      insertText: (t) => coreRef.current?.insertText(t),
      surroundSelection: (p, s) => coreRef.current?.surroundSelection(p, s),
      insertBlock: (b, nl) => coreRef.current?.insertBlock(b, nl),
      undo: () => coreRef.current?.undo(),
      redo: () => coreRef.current?.redo(),

      replaceDrawioByBase64: (b64, block) =>
        coreRef.current?.replaceDrawioByBase64(b64, block) ?? false,
    }));

    return (
      <div
        ref={hostRef}
        className={className ?? "fast-editor-host"}
        suppressContentEditableWarning
      />
    );
  },
);

FastEditor.displayName = "FastEditor";
export default FastEditor;
