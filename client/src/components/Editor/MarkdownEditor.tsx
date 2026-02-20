import React, { useRef, useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Box, useMediaQuery, Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MarkdownPage from '../Markdown';
import { useDebounce } from 'use-debounce';
import * as prettier from "prettier/standalone";
import * as prettierPluginMarkdown from 'prettier/plugins/markdown';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import { useKey } from "../../hooks/useKey";
import { useArticles } from '../../hooks/useArticles';
import FastEditor, { type FastEditorRef } from '../TestComponent/FastEditor';
import { EditorToolbar } from '../TestComponent/EditorToolbar';

interface MarkdownEditorProps {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  setIsEdited: Dispatch<SetStateAction<boolean>>;
}

// Prettier Logic (保持)
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

export default function MarkdownEditor({ text, setText, setIsEdited }: MarkdownEditorProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<FastEditorRef>(null);
  
  const [debouncedText] = useDebounce(text, 300);
  const [isSync, setIsSync] = useState(true);
  const [tab, setTab] = useState(0);
  const { uploadImage } = useArticles();

  // 画像処理コア (保持)
  const processImageUpload = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルのみアップロードできます");
      throw new Error("Invalid file type");
    }
    try {
      const { url } = await uploadImage(file);
      setIsEdited(true);
      return url;
    } catch (e) {
      console.error("Upload failed:", e);
      throw e;
    }
  };

  // ツールバーアクションロジック
  const handleToolbarAction = useCallback((type: string) => {
    let prefix = "";
    let suffix = "";
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    const headingMatch = type.match(/^h([1-6])$/);
    if (headingMatch) {
      prefix = "#".repeat(parseInt(headingMatch[1])) + " ";
    } else {
      switch (type) {
        case 'bold': prefix = "**"; suffix = "**"; break;
        case 'italic': prefix = "*"; suffix = "*"; break;
        case 'underline': prefix = "<u>"; suffix = "</u>"; break;
        case 'strikethrough': prefix = "~~"; suffix = "~~"; break;
        case 'quote': prefix = "> "; break;
        case 'code': prefix = "`"; suffix = "`"; break;
        case 'codeblock': prefix = "\n```\n"; suffix = "\n```\n"; break;
        case 'ul': prefix = "- "; break;
        case 'ol': prefix = "1. "; break;
        case 'link': prefix = "["; suffix = "](url)"; break;
        case 'hr': prefix = "\n---\n"; break;
        case 'table': prefix = "\n| Col | Col |\n| --- | --- |\n| Val | Val |\n"; break;
        case 'clear': if(confirm("全消去しますか？")) setText(""); return;
        case 'undo': document.execCommand('undo'); return;
        case 'redo': document.execCommand('redo'); return;
        default: return;
      }
    }
    document.execCommand("insertText", false, prefix + (selectedText || "") + suffix);
  }, [setText]);

  // 画像ファイル選択時の挙動
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await processImageUpload(file);
    document.execCommand("insertText", false, `\n![${file.name}](${url})\n`);
    e.target.value = ''; // リセット
  };

  // スクロール同期 (既存ロジックをFastEditor用に最適化)
  const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isSync || isSmall) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const ratio = scrollTop / (scrollHeight - clientHeight);
    
    if (previewRef.current) {
      const targetScroll = ratio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
      previewRef.current.scrollTop = targetScroll;
    }
  };

  // Prettier ショートカット
  useKey("F", async () => {
    const formatted = await prettifyMarkdown(text);
    setText(formatted);
  }, { altKey: true, shiftKey: true, preventDefault: true });

  return (
    <Box sx={{ 
      display: 'flex', flexDirection: 'column', height: "60vh", 
      border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' 
    }}>
      {/* ツールバーを最上部に配置 */}
      <EditorToolbar 
        onAction={handleToolbarAction}
        isSync={isSync}
        onSyncToggle={() => setIsSync(!isSync)}
        onImageClick={() => fileInputRef.current?.click()}
      />

      {/* 隠しファイル入力 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={handleFileInputChange} 
      />

      {isSmall && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label="Editor" />
          <Tab label="Preview" />
        </Tabs>
      )}

      <Box sx={{ display: 'flex', flex: 1, flexDirection: isSmall ? 'column' : 'row', overflow: 'hidden' }}>
        {/* エディタエリア */}
        {(tab === 0 || !isSmall) && (
          <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', borderRight: !isSmall ? '1px solid' : 'none', borderColor: 'divider' }}>
            <FastEditor
              ref={editorRef}
              value={text}
              onChange={(newText) => {
                setText(newText);
                setIsEdited(true);
              }}
              onScroll={handleEditorScroll}
              placeholder="Markdownを入力してください..."
            />
          </Box>
        )}

        {/* プレビューエリア */}
        {(tab === 1 || !isSmall) && (
          <Box
            ref={previewRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.paper',
            }}
          >
            <MarkdownPage text={debouncedText} />
          </Box>
        )}
      </Box>
    </Box>
  );
}