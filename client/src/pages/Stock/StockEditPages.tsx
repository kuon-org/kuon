import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Chip,
  Checkbox,
} from "@mui/material";
import { useState } from "react";
import { useStocks } from "../../hooks/useStocks";
import { useTagsQuery } from "../../hooks/useTags";
import { useNavigate } from "@tanstack/react-router";
import { stocksDetailsRoute, stocksRoute } from "../../routes";
import { useAuthQuery } from "../../hooks/useAuth";
import { useAdminPermissions } from "../../hooks/useRoles";

interface StockEditPageProps {
  initialData?: any;
}

export const StockEditPages = ({ initialData }: StockEditPageProps) => {
  const navigate = useNavigate();
  const isEdit = Boolean(initialData);

  const {
    createList,
    updateList,
    isCreating,
    isUpdating,
    deleteList,
    isDeleting,
  } = useStocks();
  const { tags, tags_isLoading, upsertTag } = useTagsQuery();
  const { user } = useAuthQuery();
  const { permissions } = useAdminPermissions(!!user);
  const canCreateTag =
    permissions.includes("tag.create") || permissions.includes("tag.manage");

  const [name, setName] = useState(initialData?.name || "");
  const [visibility, setVisibility] = useState(
    initialData?.visibility || "private",
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.stock_list_tags?.map((t: any) => t.tags.name) || [],
  );
  const [is_default, setIsDefault] = useState(initialData?.is_default || false);

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm("本当にこのストックリストを削除しますか？")) return;
    try {
      await deleteList(initialData.id);
      navigate({
        to: stocksRoute.to,
        search: { page: 1, q: undefined },
      });
    } catch (error) {
      console.error("削除失敗:", error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      const tagIds = await Promise.all(
        selectedTags.map(async (tagName) => {
          const existingTag = tags.find((tag) => tag.name === tagName);
          if (existingTag) return existingTag.id;
          if (!canCreateTag) throw new Error("TagCreatePermissionDenied");

          const slug = tagName.toLowerCase().trim().replace(/\s+/g, "-");
          const createdTag = await upsertTag({ name: tagName, slug });
          return createdTag.id;
        }),
      );

      const payload = {
        name,
        visibility: visibility as any,
        description,
        tagIds,
        is_default,
      };

      if (isEdit) {
        await updateList({ listId: initialData.id, payload });
        navigate({
          to: stocksDetailsRoute.to,
          search: { page: 1, q: undefined },
          params: { listId: initialData.id },
        });
      } else {
        const newList = await createList(payload);
        navigate({ to: `/stocks/${newList.id}` });
      }
    } catch (error) {
      console.error("保存失敗:", error);
    }
  };

  const isSystem = initialData?.is_system ?? false;

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          {isEdit ? "ストックリストを編集" : "新しいストックリストを作成"}
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          {isEdit && !isSystem && (
            <Button color="error" onClick={handleDelete} disabled={isDeleting}>
              このリストを削除
            </Button>
          )}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            リスト名
          </FormLabel>
          <TextField fullWidth placeholder="例: 後で読む" value={name} onChange={(e) => setName(e.target.value)} />
        </Box>

        <FormControl>
          <FormLabel sx={{ fontWeight: "bold", mb: 1 }}>公開範囲</FormLabel>
          <RadioGroup value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <FormControlLabel value="private" control={<Radio />} label="🔒 非公開" />
            <FormControlLabel value="limited" control={<Radio />} label="🔗 限定公開" />
            <FormControlLabel value="public" control={<Radio />} label="🌐 公開" />
          </RadioGroup>
        </FormControl>

        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            タグ（任意）
          </FormLabel>
          <Autocomplete
            multiple
            freeSolo={canCreateTag}
            options={tags.map((t) => t.name)}
            loading={tags_isLoading}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} size="small" key={index} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={canCreateTag ? "タグを検索して追加..." : "既存タグから選択"}
                helperText={canCreateTag ? undefined : "新しいタグを作成する権限がありません"}
              />
            )}
          />
        </Box>

        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            概要
          </FormLabel>
          <TextField fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Box>

        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            自動保存
          </FormLabel>
          <FormControlLabel
            control={
              <Checkbox
                checked={is_default}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label="ストックリスト追加時に自動でこのリストに追加する"
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button
            onClick={() =>
              navigate({
                to: stocksRoute.to,
                search: { page: 1, q: undefined },
              })
            }
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!name.trim() || isCreating || isUpdating}
          >
            {isCreating
              ? "作成中..."
              : isUpdating
                ? "更新中..."
                : "リストを保存する"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
