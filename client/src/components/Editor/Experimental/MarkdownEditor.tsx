import React, {
  useRef,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Box, useMediaQuery, Tabs, Tab, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MarkdownPage from "../../Markdown";
import { useKey } from "../../../hooks/useKey";
import { useUploadArticleImage } from "../../../hooks/articles";

import FastEditor, { type FastEditorRef } from "./FastEditor";
import "./fast-editor.css";
import { EditorToolbar } from "../../Editor/EditorToolbar";
import { DrawioEditor } from "../../Editor/DrawioEditor";
import { useNotify } from "../../../hooks/useNotify";

interface MarkdownEditorProps {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  setIsEdited: Dispatch<SetStateAction<boolean>>;
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
  const { error, notify } = useNotify();
  const [isSync, setIsSync] = useState(true);
  const [tab, setTab] = useState(0);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const uploadImage = useUploadArticleImage();

  const [isDrawioOpen, setIsDrawioOpen] = useState(false);
  const [drawioEditTarget, setDrawioEditTarget] = useState<{
    data: string;
  } | null>(null);

  const handleEditDrawio = useCallback((base64: string) => {
    setDrawioEditTarget({ data: base64 });
    setIsDrawioOpen(true);
    editorRef.current?.replaceDrawioByBase64("", "");
    editorRef.current?.focus();
  }, []);

  const handleDrawioSave = (newBase64: string) => {
    const newBlock = `\`\`\`drawio\n${newBase64}\n\`\`\``;

    if (drawioEditTarget?.data) {
      const ok = editorRef.current?.replaceDrawioByBase64(
        drawioEditTarget.data,
        newBlock,
      );
      if (!ok) {
        editorRef.current?.insertBlock(newBlock);
      }
    } else {
      editorRef.current?.insertBlock(newBlock);
    }
    setIsEdited(true);
    setDrawioEditTarget(null);
    setIsDrawioOpen(false);
  };

  const processImageUpload = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      error("画像ファイルのみアップロードできます");
      throw new Error("Invalid file type");
    }
    const { url } = await uploadImage.mutateAsync(file);
    setIsEdited(true);
    notify("画像をアップロードしました。");
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
        editorRef.current?.insertText(`\n![${file.name}](${url})\n`);
      } catch (err) {
        console.error(err);
      }
    },
    [uploadImage, setIsEdited],
  );

  const handleToolbarAction = useCallback((type: string) => {
    const ed = editorRef.current;
    if (!ed) return;

    const surround = (p: string, s: string) => ed.surroundSelection(p, s);
    const headingMatch = type.match(/^h([1-6])$/);

    if (headingMatch) {
      ed.insertText(`${"#".repeat(parseInt(headingMatch[1]))} `);
      return;
    }
    switch (type) {
      case "bold":
        surround("**", "**");
        break;
      case "italic":
        surround("*", "*");
        break;
      case "underline":
        surround("<u>", "</u>");
        break;
      case "strikethrough":
        surround("~~", "~~");
        break;
      case "quote":
        ed.insertText("> ");
        break;
      case "code":
        surround("`", "`");
        break;
      case "codeblock":
        ed.insertBlock("```\n\n```");
        break;
      case "ul":
        ed.insertText("- ");
        break;
      case "ol":
        ed.insertText("1. ");
        break;
      case "link":
        surround("[", "](url)");
        break;
      case "hr":
        ed.insertBlock("---");
        break;
      case "table":
        ed.insertBlock("| Col | Col |\n| --- | --- |\n| Val | Val |");
        break;
      case "drawio":
        setIsDrawioOpen(true);
        return;
      case "clear":
        if (confirm("全消去しますか？")) ed.setValue("");
        return;
      case "undo":
        ed.undo();
        return;
      case "redo":
        ed.redo();
        return;
      default:
        return;
    }
  }, []);

  const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isSync || isSmall || viewMode !== "split") return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const ratio = scrollTop / Math.max(1, scrollHeight - clientHeight);
    if (previewRef.current) {
      previewRef.current.scrollTop =
        ratio *
        (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    }
  };

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
            editorRef.current?.insertText(`\n![${file.name}](${url})\n`);
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
                initialValue={text}
                debounceMs={500}
                onChange={(debouncedText) => {
                  setText(debouncedText);
                  setIsEdited(true);
                }}
                onScroll={handleEditorScroll as any}
                onFilesDropped={async (files) => {
                  const f = files[0];
                  if (!f) return;
                  try {
                    const url = await processImageUpload(f);
                    editorRef.current?.insertText(`\n![${f.name}](${url})\n`);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                placeholder="Write Markdown..."
                className="fast-editor"
              />
            </Box>
          )}

        {(viewMode === "preview" || viewMode === "split") &&
          (tab === 1 || !isSmall) && (
            <Paper
              ref={previewRef}
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                borderRadius: 0,
              }}
            >
              <MarkdownPage text={text} onEditDrawio={handleEditDrawio} />
            </Paper>
          )}
      </Box>

      <DrawioEditor
        open={isDrawioOpen}
        onClose={() => {
          setIsDrawioOpen(false);
          setDrawioEditTarget(null);
        }}
        onSave={handleDrawioSave}
        initialData={drawioEditTarget?.data}
      />
    </Box>
  );
}
