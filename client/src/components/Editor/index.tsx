import { useCallback, useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Typography,
  AppBar,
  Toolbar,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from "@mui/material";
// import MarkdownEditor from "./MarkdownEditor";
import MarkdownEditor from "./Experimental/MarkdownEditor";
import { type UseMutateAsyncFunction } from "@tanstack/react-query";
import { type Article } from "../../hooks/useArticles";
import { useTagsQuery } from "../../hooks/useTags";
import { useKey } from "../../hooks/useKey";
import { useNotify } from "../../hooks/useNotify";
import { draftsRoute } from "../../router";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ConfirmLeaveDialog } from "../common/ConfirmLeaveDialog";

interface ArticleEditorProps {
  mutate: UseMutateAsyncFunction<any, any, any, unknown>;
  isFetching: boolean;
  article?: Article;
}

export default function ArticleEditor({
  mutate,
  isFetching,
  article,
}: ArticleEditorProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const { error, success } = useNotify();
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [text, setText] = useState(article?.raw_content ?? "");
  const [isPublished, setIsPublished] = useState(
    article?.is_published ?? false,
  );
  const [isEdited, setIsEdited] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  // 🚀 ダイアログの開閉状態
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { tags, upsertTag } = useTagsQuery();
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(
    article?.article_tags?.map((at) => at.tags.name) ?? [],
  );
  const [isPrivate, setIsPrivate] = useState(article?.is_private ?? false);

  // 🚀 表示用の状態判定（ラジオボタン用）
  const getVisibilityValue = () => {
    if (isPrivate) return "private";
    if (isPublished) return "public";
    return "unlisted"; // isPublished: false かつ isPrivate: false
  };

  const handleVisibilityChange = (value: string) => {
    if (value === "public") {
      setIsPublished(true);
      setIsPrivate(false);
    } else if (value === "unlisted") {
      setIsPublished(false);
      setIsPrivate(false);
    } else {
      setIsPublished(true); // privateの時も窓口自体はtrue（本人のみ鍵で開ける状態）
      setIsPrivate(true);
    }
  };
  const handleSave = useCallback(
    async (mode: "draft" | "public") => {
      try {
        const upsertedTags = await Promise.all(
          selectedTagNames.map((name) => {
            const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
            return upsertTag({ name, slug });
          }),
        );
        const tagIds = upsertedTags.map((t) => t.id);

        await mutate(
          {
            title,
            raw_content: text,
            summary,
            status: mode,
            // 🚀 新しいフラグを送信
            is_published: isPublished,
            is_private: isPrivate,
            tagIds,
          },
          {
            // 🚀 onSuccess / onError を使うと確実に完了を検知できます
            onSuccess: () => {
              if (mode === "draft") success("下書きを保存しました。");
              if (mode === "public") success("記事を公開しました");

              setIsDialogOpen(false);
              setIsEdited(false);
            },
            onError: () => {
              error("保存に失敗しました。通信状況を確認してください。");
            },
          },
        );
        setIsDialogOpen(false);
      } catch (err) {
        console.error("保存失敗:", err);
        error("エラーが発生しました");
      }
    },
    [
      title,
      text,
      summary,
      isPublished,
      isPrivate,
      selectedTagNames,
      mutate,
      upsertTag,
      isFetching,
    ],
  );
  const handleBack = () => {
    router.history.back();
  };
  useKey(
    "s",
    async () => {
      if (article) {
        if (isDialogOpen) {
          await handleSave("public");
          navigate({ to: draftsRoute.to });
        } else if (!isEdited) return setIsDialogOpen(true);
        else await handleSave("draft");
      } else {
        if (isDialogOpen) {
          await handleSave("public");
          if (article) navigate({ to: draftsRoute.to });
          else navigate({ to: "/" });
        } else {
          setIsDialogOpen(true);
        }
      }
    },
    { ctrlKey: true, preventDefault: true },
  );
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <AppBar position="relative" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">記事執筆</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={
                isEdited ? () => setIsConfirmDialogOpen(true) : handleBack
              }
            >
              {isEdited ? "キャンセル" : "閉じる"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleSave("draft")}
              disabled={isFetching}
            >
              下書き保存
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsDialogOpen(true)}
              disabled={!text.trim()}
            >
              投稿設定へ
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          py: 1,
          px: { md: 3 },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TextField
          fullWidth
          label="タイトル"
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiInputBase-root": { fontSize: "1.5rem", fontWeight: "bold" },
          }}
        />

        <Autocomplete
          multiple
          freeSolo
          options={tags?.map((t) => t.name) || []}
          value={selectedTagNames}
          onChange={(_e, newValue) => setSelectedTagNames(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option}
                {...getTagProps({ index })}
                key={index}
                variant="outlined"
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="タグ"
              placeholder="Enterで追加"
              variant="standard"
              sx={{ mb: 2 }}
            />
          )}
        />

        <TextField
          fullWidth
          label="要約"
          multiline
          maxRows={3}
          variant="standard"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          sx={{ mb: 2 }}
        />

        <MarkdownEditor
          text={text}
          setText={setText}
          setIsEdited={setIsEdited}
        />
      </Box>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>投稿設定</DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1 }}>
              公開範囲の設定
            </FormLabel>
            <RadioGroup
              value={getVisibilityValue()}
              onChange={(e) => handleVisibilityChange(e.target.value)}
            >
              <FormControlLabel
                value="public"
                control={<Radio />}
                label="🌐 全体に公開（一覧に表示）"
              />
              <FormControlLabel
                value="unlisted"
                control={<Radio />}
                label="🔗 限定公開（URLを知っている人のみ）"
              />
              <FormControlLabel
                value="private"
                control={<Radio />}
                label="🔒 非公開（自分のみ閲覧）"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">
            戻る
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSave("public")}
            disabled={isFetching || !title.trim()}
          >
            {isFetching
              ? "送信中..."
              : (() => {
                  if (isPrivate) return "保存（非公開）";
                  if (isPublished) return "保存して公開";
                  return "保存して限定公開"; // isPublished: false かつ isPrivate: false
                })()}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmLeaveDialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
      />
    </Box>
  );
}
