import React, {
  useRef,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Box, useMediaQuery, Tabs, Tab } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MarkdownPage from "../Markdown";
import { useDebounce } from "use-debounce";
import * as prettier from "prettier/standalone";
import * as prettierPluginMarkdown from "prettier/plugins/markdown";
import * as prettierPluginEstree from "prettier/plugins/estree";
import { useKey } from "../../hooks/useKey";
import { useArticles } from "../../hooks/useArticles";
import FastEditor, { type FastEditorRef } from "./FastEditor";
// import FastEditor, { type FastEditorRef } from "./FastEditorWithDrawio_Experimental";
import { EditorToolbar } from "./EditorToolbar";
import { DrawioEditor } from "./DrawioEditor";

interface MarkdownEditorProps {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  setIsEdited: Dispatch<SetStateAction<boolean>>;
}

async function prettifyMarkdown(text: string): Promise<string> {
  try {
    return await prettier.format(text, {
      parser: "markdown",
      plugins: [prettierPluginMarkdown, prettierPluginEstree],
    });
  } catch (e) {
    console.error("Markdown formatting failed:", e);
    return text;
  }
}

export default function MarkdownEditor({
  text,
  setText,
  setIsEdited,
}: MarkdownEditorProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<FastEditorRef>(null);

  const [debouncedText] = useDebounce(text, 300);
  const [isSync, setIsSync] = useState(true);
  const [tab, setTab] = useState(0); // モバイル用
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { uploadImage } = useArticles();
  const [isDrawioOpen, setIsDrawioOpen] = useState(false);
  const [drawioEditTarget, setDrawioEditTarget] = useState<{
    original: string;
    data: string;
  } | null>(null);

  const handleEditDrawio = useCallback(
    (base64: string) => {
      // 実際にtext内にある「```drawio」から「```」までのブロックを探す
      // 改行コード（\r\n か \n）の違いを吸収するために正規表現を使います
      const regex = new RegExp(
        `\`\`\`drawio\\s*[\\s\\S]*?${base64.substring(0, 20)}[\\s\\S]*?\`\`\``,
      );
      const match = text.match(regex);

      if (match) {
        setDrawioEditTarget({
          original: match[0], // 見つかったブロック丸ごと（置換用）
          data: base64, // 純粋なBase64データ（エディタ送信用）
        });
        setIsDrawioOpen(true);
      } else {
        // 万が一見つからない場合は、データだけ持ってエディタを開く
        setDrawioEditTarget({
          original: "",
          data: base64,
        });
        setIsDrawioOpen(true);
      }
    },
    [text],
  );

  const handleDrawioSave = (newBase64: string) => {
    const newBlock = `\`\`\`drawio\n${newBase64}\n\`\`\``;

    // originalが空でない場合は置換、空なら挿入
    if (drawioEditTarget && drawioEditTarget.original) {
      const updatedText = text.replace(drawioEditTarget.original, newBlock);
      setText(updatedText);
      setDrawioEditTarget(null);
    } else {
      // 挿入位置を制御するためにexecCommandを使用
      document.execCommand("insertText", false, `\n${newBlock}\n`);
    }
    setIsEdited(true);
  };
  const processImageUpload = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルのみアップロードできます");
      throw new Error("Invalid file type");
    }
    const { url } = await uploadImage(file);
    setIsEdited(true);
    return url;
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      try {
        const url = await processImageUpload(file);
        document.execCommand(
          "insertText",
          false,
          `\n![${file.name}](${url})\n`,
        );
      } catch (err) {
        console.error(err);
      }
    },
    [uploadImage, setIsEdited],
  );

  const handleToolbarAction = useCallback(
    (type: string) => {
      let prefix = "",
        suffix = "";
      const selection = window.getSelection();
      const selectedText = selection?.toString() || "";
      const headingMatch = type.match(/^h([1-6])$/);
      if (headingMatch) {
        prefix = "#".repeat(parseInt(headingMatch[1])) + " ";
      } else {
        switch (type) {
          case "bold":
            prefix = "**";
            suffix = "**";
            break;
          case "italic":
            prefix = "*";
            suffix = "*";
            break;
          case "underline":
            prefix = "<u>";
            suffix = "</u>";
            break;
          case "strikethrough":
            prefix = "~~";
            suffix = "~~";
            break;
          case "quote":
            prefix = "> ";
            break;
          case "code":
            prefix = "`";
            suffix = "`";
            break;
          case "codeblock":
            prefix = "\n```\n";
            suffix = "\n```\n";
            break;
          case "ul":
            prefix = "- ";
            break;
          case "ol":
            prefix = "1. ";
            break;
          case "link":
            prefix = "[";
            suffix = "](url)";
            break;
          case "hr":
            prefix = "\n---\n";
            break;
          case "table":
            prefix = "\n| Col | Col |\n| --- | --- |\n| Val | Val |\n";
            break;
          case "drawio":
            setIsDrawioOpen(true);
            return;
          case "clear":
            if (confirm("全消去しますか？")) setText("");
            return;
          case "undo":
            document.execCommand("undo");
            return;
          case "redo":
            document.execCommand("redo");
            return;
          default:
            return;
        }
      }
      document.execCommand(
        "insertText",
        false,
        prefix + (selectedText || "") + suffix,
      );
    },
    [setText],
  );

  const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isSync || isSmall || viewMode !== "split") return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const ratio = scrollTop / (scrollHeight - clientHeight);
    if (previewRef.current) {
      previewRef.current.scrollTop =
        ratio *
        (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    }
  };

  useKey(
    "F",
    async () => {
      const formatted = await prettifyMarkdown(text);
      setText(formatted);
    },
    { altKey: true, shiftKey: true, preventDefault: true },
  );
  useKey(
    "Enter",
    () => {
      setIsFullscreen(!isFullscreen);
    },
    { ctrlKey: true, preventDefault: true },
  );
  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      sx={{
        display: "flex",
        flexDirection: "column",
        border: isFullscreen ? "none" : "1px solid",
        borderColor: "divider",
        borderRadius: isFullscreen ? 0 : 1,
        overflow: "hidden",
        ...(isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1300,
              bgcolor: "background.paper",
            }
          : {
              height: "60vh",
            }),
      }}
    >
      <EditorToolbar
        onAction={handleToolbarAction}
        isSync={isSync}
        onSyncToggle={() => setIsSync(!isSync)}
        onImageClick={() => fileInputRef.current?.click()}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isFullscreen={isFullscreen}
        onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
      />

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = await processImageUpload(file);
            document.execCommand(
              "insertText",
              false,
              `\n![${file.name}](${url})\n`,
            );
          }
          e.target.value = "";
        }}
      />

      {isSmall && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label="Editor" />
          <Tab label="Preview" />
        </Tabs>
      )}

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* エディタ */}
        {(viewMode === "editor" || viewMode === "split") &&
          (tab === 0 || !isSmall) && (
            <Box
              sx={{
                flex: 1,
                height: "100%",
                borderRight: viewMode === "split" ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              <FastEditor
                ref={editorRef}
                value={text}
                onChange={(newText) => {
                  setText(newText);
                  setIsEdited(true);
                }}
                onScroll={handleEditorScroll}
              />
            </Box>
          )}

        {/* プレビュー */}
        {(viewMode === "preview" || viewMode === "split") &&
          (tab === 1 || !isSmall) && (
            <Box
              ref={previewRef}
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                bgcolor: "background.paper",
              }}
            >
              <MarkdownPage
                text={debouncedText}
                onEditDrawio={handleEditDrawio}
              />
            </Box>
          )}
      </Box>

      <DrawioEditor
        open={isDrawioOpen}
        onClose={() => {
          setIsDrawioOpen(false);
          setDrawioEditTarget(null); // ついでにクリア推奨
        }}
        onSave={handleDrawioSave}
        initialData={drawioEditTarget?.data}
      />
    </Box>
  );
}
