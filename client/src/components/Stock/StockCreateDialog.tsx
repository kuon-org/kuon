import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Divider,
  IconButton,
  Box,
  Autocomplete,
  Chip,
  FormControl,
  FormLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useStocks } from "../../hooks/useStocks";
import { useTagsQuery } from "../../hooks/useTags";

export const StockCreateDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { createList, isCreating } = useStocks();

  // 修正：useTagsQuery から tags と tags_isLoading を直接取り出す
  const { tags, tags_isLoading, upsertTag } = useTagsQuery();

  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      // 1. 未登録のタグ（文字列のもの）を先に Upsert して ID を取得する
      const upsertedTags = await Promise.all(
        selectedTags.map((name) => {
          const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
          return upsertTag({ name, slug });
        }),
      );
      const tagIds = upsertedTags.map((t) => t.id);
      // 2. 確定した ID 配列を使ってストックリストを作成
      await createList({
        name,
        visibility: visibility as any,
        description,
        tagIds, // ここで repository 期待の string[] を渡す
      });

      // リセットして閉じる
      setName("");
      setVisibility("private");
      setDescription("");
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error("作成失敗:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          ストックリストを作成する
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
      >
        {/* リスト名 */}
        <Box>
          <FormLabel
            sx={{
              fontWeight: "bold",
              fontSize: "0.85rem",
              mb: 1,
              display: "block",
            }}
          >
            ストックリストの名前{" "}
            <Typography component="span" color="error" variant="caption">
              必須
            </Typography>
          </FormLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="例: 後で読む、技術ネタ"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Box>

        {/* 公開範囲 */}
        <FormControl>
          <FormLabel sx={{ fontWeight: "bold", fontSize: "0.85rem", mb: 1 }}>
            公開範囲{" "}
            <Typography component="span" color="error" variant="caption">
              必須
            </Typography>
          </FormLabel>
          <RadioGroup
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <FormControlLabel
              value="private"
              control={<Radio size="small" />}
              label="🔒 非公開"
            />
            <FormControlLabel
              value="limited"
              control={<Radio size="small" />}
              label="🔗 限定公開"
            />
            <FormControlLabel
              value="public"
              control={<Radio size="small" />}
              label="🌐 公開"
            />
          </RadioGroup>
        </FormControl>

        {/* タグ設定 */}
        <Box>
          <FormLabel
            sx={{
              fontWeight: "bold",
              fontSize: "0.85rem",
              mb: 1,
              display: "block",
            }}
          >
            タグの設定{" "}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              任意
            </Typography>
          </FormLabel>
          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={tags?.map((t) => t.name) || []} // 修正：tags (配列) をそのまま使用
            loading={tags_isLoading} // 修正：tags_isLoading を使用
            value={selectedTags}
            onChange={(_event, newValue) => setSelectedTags(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  size="small"
                  key={index}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="タグを検索して追加..."
                variant="outlined"
              />
            )}
          />
        </Box>

        {/* 概要 */}
        <Box>
          <FormLabel
            sx={{
              fontWeight: "bold",
              fontSize: "0.85rem",
              mb: 1,
              display: "block",
            }}
          >
            概要{" "}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              任意
            </Typography>
          </FormLabel>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="どのようなリストか説明を入力"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!name.trim() || isCreating}
          sx={{ fontWeight: "bold" }}
        >
          {isCreating ? "作成中..." : "作成"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
