import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useCallback,
} from "react";

interface FastEditorProps {
  value: string;
  onChange: (text: string) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  placeholder?: string;
}

export interface FastEditorRef {
  setValue: (text: string) => void;
  getValue: () => string;
}

const DRAWIO_RE = /```drawio\s*\n([\s\S]*?)\n```/g;

// markerに私用領域文字を使うと衝突しにくい
const markerOf = (id: string) => `\uE000DRAWIO:${id}\uE001`;

const FastEditor = forwardRef<FastEditorRef, FastEditorProps>(
  ({ value, onChange, onScroll, placeholder }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // id -> fullBlock（```drawio\n...\n```まるごと）
    const drawioMapRef = useRef<Map<string, string>>(new Map());

    // IME中はDOM更新しない（日本語入力安定化）
    const isComposingRef = useRef(false);

    // 現DOM（collapsed時はmarker入り）からフルMarkdownへ復元
    const restoreFullMarkdown = useCallback((visibleText: string) => {
      let out = visibleText;

      for (const [id, full] of drawioMapRef.current.entries()) {
        out = out.split(markerOf(id)).join(full);
      }
      return out;
    }, []);

    // value（フルMarkdown）をDOMへ反映（drawioブロックをトークン化）
    const renderFromValue = useCallback((md: string) => {
      const el = editorRef.current;
      if (!el) return;

      // 新しいmapを作って差し替え
      const newMap = new Map<string, string>();

      // DOMを組み立てる
      const frag = document.createDocumentFragment();

      let lastIndex = 0;
      let m: RegExpExecArray | null;
      let seq = 0;

      while ((m = DRAWIO_RE.exec(md)) !== null) {
        const fullMatch = m[0]; // ```drawio\n...\n``` 全体
        const start = m.index;
        const end = start + fullMatch.length;

        // 通常テキスト部分
        frag.appendChild(document.createTextNode(md.slice(lastIndex, start)));

        // トークン要素
        const id = `d${seq++}`;
        newMap.set(id, fullMatch);

        const token = document.createElement("span");
        token.className = "drawio-token collapsed";
        token.setAttribute("contenteditable", "false");
        token.setAttribute("data-drawio-id", id);
        token.setAttribute("data-label", "```drawio ...```"); // 見た目はこれだけ
        token.textContent = markerOf(id); // DOM上の実体はmarker

        frag.appendChild(token);

        lastIndex = end;
      }

      frag.appendChild(document.createTextNode(md.slice(lastIndex)));

      // 既存DOMを置換
      el.replaceChildren(frag);
      drawioMapRef.current = newMap;
    }, []);

    // 外部更新（Prettierなど）をDOMへ反映
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (isComposingRef.current) return;

      // ★ここが超重要：現在DOMを “フルMarkdownに復元して” value と比較
      const currentFull = restoreFullMarkdown(el.innerText);

      if (currentFull !== value) {
        renderFromValue(value);
      }
    }, [value, renderFromValue, restoreFullMarkdown]);

    // compositionイベント（IME対策）
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;

      const onStart = () => (isComposingRef.current = true);
      const onEnd = () => (isComposingRef.current = false);

      el.addEventListener("compositionstart", onStart);
      el.addEventListener("compositionend", onEnd);

      return () => {
        el.removeEventListener("compositionstart", onStart);
        el.removeEventListener("compositionend", onEnd);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      setValue: (text: string) => renderFromValue(text),
      getValue: () => {
        const el = editorRef.current;
        if (!el) return "";
        return restoreFullMarkdown(el.innerText);
      },
    }));

    const hasSelection = () => {
      const sel = window.getSelection();
      return !!sel && sel.type === "Range" && sel.toString().length > 0;
    };

    // ユーザー入力 → フルMarkdownで親へ
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const visible = e.currentTarget.innerText;
      onChange(restoreFullMarkdown(visible));
    };

    // tokenクリックで展開/折りたたみ（DOM表示だけ変える）
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const token = target.closest(".drawio-token") as HTMLElement | null;
      if (!token) return;

      const id = token.getAttribute("data-drawio-id") || "";
      const full = drawioMapRef.current.get(id);
      if (!full) return;

      if (token.classList.contains("collapsed")) {
        // 展開：フルブロックを表示（コピーできる）
        token.classList.remove("collapsed");
        token.classList.add("expanded");
        token.textContent = full;
      } else {
        if (hasSelection()) return;
        // 折りたたみ：markerに戻す（見た目はCSSでlabel表示）
        token.classList.remove("expanded");
        token.classList.add("collapsed");
        token.textContent = markerOf(id);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    };

    return (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onClick={handleClick}
        onScroll={onScroll}
        onPaste={handlePaste}
        spellCheck={false}
        data-placeholder={placeholder}
        className="fast-editor" // index.css
      />
    );
  },
);

FastEditor.displayName = "FastEditor";
export default FastEditor;
