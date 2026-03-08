// FastEditorCore.ts
export type ChangeListener = (fullMarkdown: string) => void;
export type ScrollListener = (ev: Event) => void;
export type FilesDroppedListener = (files: FileList, ev: DragEvent) => void;

export type FastEditorCoreOptions = {
  placeholder?: string;
  onChange?: ChangeListener; // 即時発火（デバウンスなし）
  onScroll?: ScrollListener;
  onFilesDropped?: FilesDroppedListener;
};

const DRAWIO_RE = /```drawio\s*\n([\s\S]*?)\n```/g;
const markerOf = (id: string) => `\uE000DRAWIO:${id}\uE001`;
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

export class FastEditorCore {
  private el: HTMLDivElement;
  private options: FastEditorCoreOptions;
  private composing = false;
  private drawioMap = new Map<string, string>();
  private seq = 0;

  constructor(el: HTMLDivElement, options: FastEditorCoreOptions = {}) {
    this.el = el;
    this.options = options;
    this.bootstrap();
  }

  destroy() {
    this.el.removeEventListener("compositionstart", this.onCompStart);
    this.el.removeEventListener("compositionend", this.onCompEnd);
    this.el.removeEventListener("input", this.onInput);
    this.el.removeEventListener("beforeinput", this.onBeforeInput as any);
    this.el.removeEventListener("click", this.onClick);
    this.el.removeEventListener("scroll", this.onScroll as any);
    this.el.removeEventListener("paste", this.onPaste);
    this.el.removeEventListener("drop", this.onDrop);
  }

  /** 初期化 */
  private bootstrap() {
    this.el.contentEditable = "true";
    this.el.spellcheck = false;
    this.el.classList.add("fast-editor");
    if (this.options.placeholder) {
      this.el.dataset.placeholder = this.options.placeholder;
    }

    this.el.addEventListener("compositionstart", this.onCompStart, {
      passive: true,
    });
    this.el.addEventListener("compositionend", this.onCompEnd, {
      passive: true,
    });
    this.el.addEventListener("input", this.onInput, { passive: true });
    this.el.addEventListener("beforeinput", this.onBeforeInput as any);
    this.el.addEventListener("click", this.onClick);
    this.el.addEventListener("scroll", this.onScroll as any);
    this.el.addEventListener("paste", this.onPaste);
    this.el.addEventListener("drop", this.onDrop);
    this.el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // 例: Cmd/Ctrl + B/I
    this.el.addEventListener("keydown", (e) => {
      if ((isMac() ? e.metaKey : e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === "b") {
          e.preventDefault();
          this.surroundSelection("**", "**");
        } else if (k === "i") {
          e.preventDefault();
          this.surroundSelection("*", "*");
        }
      }
    });
  }

  /** value(フルMarkdown)を DOM へ描画（drawio トークン化） */
  setValue(md: string) {
    if (this.composing) return;
    const newMap = new Map<string, string>();
    this.seq = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = DRAWIO_RE.exec(md)) !== null) {
      const fullMatch = m[0];
      const start = m.index;
      const end = start + fullMatch.length;

      frag.appendChild(document.createTextNode(md.slice(lastIndex, start)));

      const id = `d${this.seq++}`;
      newMap.set(id, fullMatch);

      const token = document.createElement("span");
      token.className = "drawio-token collapsed";
      token.setAttribute("contenteditable", "false");
      token.setAttribute("data-drawio-id", id);
      token.setAttribute("data-label", "```drawio ...```");
      token.textContent = markerOf(id);

      frag.appendChild(token);
      lastIndex = end;
    }

    frag.appendChild(document.createTextNode(md.slice(lastIndex)));

    this.el.replaceChildren(frag);
    this.drawioMap = newMap;
  }

  /** 現DOM(=marker含む可視テキスト)からフルMarkdownへ復元 */
  private restoreFullMarkdown(visible: string): string {
    let out = visible;
    for (const [id, full] of this.drawioMap.entries()) {
      out = out.split(markerOf(id)).join(full);
    }
    return out;
  }

  /** 現在のフルMarkdown を返す */
  getValue(): string {
    const text = this.el.textContent ?? "";
    return this.restoreFullMarkdown(text);
  }

  focus() {
    this.el.focus();
  }

  /** プレーン挿入/置換 */
  replaceSelection(text: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.insertText(text);
      return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    this.emitChange();
  }

  insertText(text: string) {
    this.replaceSelection(text);
  }

  surroundSelection(prefix: string, suffix: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.insertText(prefix + suffix);
      // caret を prefix の後ろへ動かす（任意）
      this.emitChange();
      return;
    }
    const text = sel.toString();
    this.replaceSelection(prefix + text + suffix);
  }

  insertBlock(block: string, surroundWithNewlines = true) {
    const before = surroundWithNewlines ? "\n" : "";
    const after = surroundWithNewlines ? "\n" : "";
    this.replaceSelection(`${before}${block}${after}`);
  }

  /** Undo/Redo はブラウザ互換のため execCommand を使用 */
  undo() {
    document.execCommand("undo");
    this.emitChange();
  }
  redo() {
    document.execCommand("redo");
    this.emitChange();
  }

  /** base64 の先頭一致で対応 drawio ブロックを置換（トークンごと差し替え） */
  replaceDrawioByBase64(base64: string, newBlock: string): boolean {
    const head = base64.slice(0, 20);
    // id を特定
    let targetId: string | null = null;
    for (const [id, full] of this.drawioMap.entries()) {
      if (full.includes(head)) {
        targetId = id;
        break;
      }
    }
    if (!targetId) return false;

    const token = this.el.querySelector(
      `.drawio-token[data-drawio-id="${targetId}"]`,
    );
    if (!token || !token.parentNode) return false;

    // 新しいテキストノードに差し替え
    const textNode = document.createTextNode(newBlock);
    token.parentNode.replaceChild(textNode, token);

    // Map 更新
    this.drawioMap.delete(targetId);

    this.emitChange();
    return true;
  }

  /** クリックで drawio token を展開/折りたたみ */
  private onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const token = target.closest(".drawio-token") as HTMLElement | null;
    if (!token) return;

    const id = token.getAttribute("data-drawio-id") || "";
    const full = this.drawioMap.get(id);
    if (!full) return;

    if (token.classList.contains("collapsed")) {
      token.classList.remove("collapsed");
      token.classList.add("expanded");
      token.textContent = full;
    } else {
      const sel = window.getSelection();
      if (sel && sel.type === "Range" && sel.toString()) return;
      token.classList.remove("expanded");
      token.classList.add("collapsed");
      token.textContent = markerOf(id);
    }
  };

  private onCompStart = () => (this.composing = true);
  private onCompEnd = () => {
    this.composing = false;
    this.emitChange();
  };
  private onInput = () => {
    if (this.composing) return;
    this.emitChange();
  };
  private onBeforeInput = (_e: InputEvent) => {
    // 必要なら inputType ごとにハンドリング
  };
  private onScroll = (ev: Event) => this.options.onScroll?.(ev);
  private onPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items ?? [];
    const hasFile = Array.from(items).some((it) => it.kind === "file");
    if (hasFile) {
      e.preventDefault();
      const files: File[] = [];
      for (const it of Array.from(items)) {
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        this.options.onFilesDropped?.(dt.files, e as unknown as DragEvent);
      }
    }
  };
  private onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.options.onFilesDropped?.(e.dataTransfer.files, e);
    }
  };

  /** 即時発火（デバウンスなし） */
  private emitChange() {
    const md = this.getValue();
    this.options.onChange?.(md);
  }
}
