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
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  useCreateStockList,
  useDeleteStockList,
  useUpdateStockList,
} from "../../hooks/stocks";
import { useTagsQuery, useUpsertTag } from "../../hooks/tags";
import { stocksDetailsRoute, stocksRoute } from "../../routes";
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyPermissionsQuery } from "../../hooks/roles";

interface StockEditPageProps {
  initialData?: any;
}

export const StockEditPages = ({ initialData }: StockEditPageProps) => {
  const { t } = useTranslation("articles");
  const navigate = useNavigate();
  const isEdit = Boolean(initialData);
  const createList = useCreateStockList();
  const updateList = useUpdateStockList();
  const deleteList = useDeleteStockList();
  const tagsQuery = useTagsQuery();
  const upsertTag = useUpsertTag();
  const tags = tagsQuery.data ?? [];
  const authUserQuery = useAuthUserQuery();
  const permissionsQuery = useMyPermissionsQuery(!!authUserQuery.data);
  const permissions = permissionsQuery.data?.permissions ?? [];
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
    initialData?.stock_list_tags?.map((item: any) => item.tags.name) || [],
  );
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);

  const handleDelete = async () => {
    if (!initialData?.id || !window.confirm(t("stock.edit.deleteConfirm")))
      return;
    try {
      await deleteList.mutateAsync(initialData.id);
      navigate({ to: stocksRoute.to, search: { page: 1, q: undefined } });
    } catch (error) {
      console.error("Failed to delete stock list:", error);
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
          const createdTag = await upsertTag.mutateAsync({
            name: tagName,
            slug,
          });
          return createdTag.id;
        }),
      );
      const payload = {
        name,
        visibility: visibility as "public" | "limited" | "private",
        description,
        tagIds,
        is_default: isDefault,
      };
      if (isEdit) {
        await updateList.mutateAsync({ listId: initialData.id, payload });
        navigate({
          to: stocksDetailsRoute.to,
          search: { page: 1, q: undefined },
          params: { listId: initialData.id },
        });
      } else {
        const newList = await createList.mutateAsync(payload);
        navigate({ to: `/stocks/${newList.id}` });
      }
    } catch (error) {
      console.error("Failed to save stock list:", error);
    }
  };

  const isSystem = initialData?.is_system ?? false;

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={3}>
          {isEdit ? t("stock.edit.title") : t("stock.edit.newTitle")}
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          {isEdit && !isSystem && (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={deleteList.isPending}
            >
              {t("stock.edit.delete")}
            </Button>
          )}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            {t("stock.edit.name")}
          </FormLabel>
          <TextField
            fullWidth
            placeholder={t("stock.edit.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Box>
        <FormControl>
          <FormLabel sx={{ fontWeight: "bold", mb: 1 }}>
            {t("stock.edit.visibility")}
          </FormLabel>
          <RadioGroup
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <FormControlLabel
              value="private"
              control={<Radio />}
              label={t("stock.create.private")}
            />
            <FormControlLabel
              value="limited"
              control={<Radio />}
              label={t("stock.create.limited")}
            />
            <FormControlLabel
              value="public"
              control={<Radio />}
              label={t("stock.create.public")}
            />
          </RadioGroup>
        </FormControl>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            {t("stock.edit.tags")}
          </FormLabel>
          <Autocomplete
            multiple
            freeSolo={canCreateTag}
            options={tags.map((tag) => tag.name)}
            loading={tagsQuery.isLoading}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
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
                placeholder={
                  canCreateTag
                    ? t("stock.create.tagSearch")
                    : t("stock.create.selectExistingTag")
                }
                helperText={
                  canCreateTag
                    ? undefined
                    : t("stock.create.noTagCreatePermission")
                }
              />
            )}
          />
        </Box>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            {t("stock.edit.description")}
          </FormLabel>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", mb: 1, display: "block" }}>
            {t("stock.edit.autoSave")}
          </FormLabel>
          <FormControlLabel
            control={
              <Checkbox
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label={t("stock.edit.autoSaveDescription")}
          />
        </Box>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
        >
          <Button
            onClick={() =>
              navigate({
                to: stocksRoute.to,
                search: { page: 1, q: undefined },
              })
            }
          >
            {t("stock.edit.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              !name.trim() || createList.isPending || updateList.isPending
            }
          >
            {createList.isPending
              ? t("stock.edit.creating")
              : updateList.isPending
                ? t("stock.edit.updating")
                : t("stock.edit.save")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
