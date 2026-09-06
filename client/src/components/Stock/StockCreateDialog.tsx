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
import { useTranslation } from "react-i18next";
import { useCreateStockList } from "../../hooks/stocks";
import { useTagsQuery } from "../../hooks/useTags";
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyPermissionsQuery } from "../../hooks/roles";

export const StockCreateDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation("articles");
  const createList = useCreateStockList();
  const { tags, tags_isLoading, upsertTag } = useTagsQuery();
  const authUserQuery = useAuthUserQuery();
  const permissionsQuery = useMyPermissionsQuery(!!authUserQuery.data);
  const permissions = permissionsQuery.data?.permissions ?? [];
  const canCreateTag = permissions.includes("tag.create") || permissions.includes("tag.manage");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const tagIds = await Promise.all(selectedTags.map(async (tagName) => {
        const existingTag = tags.find((tag) => tag.name === tagName);
        if (existingTag) return existingTag.id;
        if (!canCreateTag) throw new Error("TagCreatePermissionDenied");
        const slug = tagName.toLowerCase().trim().replace(/\s+/g, "-");
        const createdTag = await upsertTag({ name: tagName, slug });
        return createdTag.id;
      }));
      await createList.mutateAsync({ name, visibility: visibility as "public" | "limited" | "private", description, tagIds });
      setName("");
      setVisibility("private");
      setDescription("");
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error("Failed to create stock list:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold">{t("stock.create.title")}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", fontSize: "0.85rem", mb: 1, display: "block" }}>
            {t("stock.create.name")} <Typography component="span" color="error" variant="caption">{t("stock.create.required")}</Typography>
          </FormLabel>
          <TextField fullWidth size="small" placeholder={t("stock.create.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        </Box>
        <FormControl>
          <FormLabel sx={{ fontWeight: "bold", fontSize: "0.85rem", mb: 1 }}>
            {t("stock.create.visibility")} <Typography component="span" color="error" variant="caption">{t("stock.create.required")}</Typography>
          </FormLabel>
          <RadioGroup value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <FormControlLabel value="private" control={<Radio size="small" />} label={t("stock.create.private")} />
            <FormControlLabel value="limited" control={<Radio size="small" />} label={t("stock.create.limited")} />
            <FormControlLabel value="public" control={<Radio size="small" />} label={t("stock.create.public")} />
          </RadioGroup>
        </FormControl>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", fontSize: "0.85rem", mb: 1, display: "block" }}>
            {t("stock.create.tags")} <Typography component="span" variant="caption" color="text.secondary">{t("stock.create.optional")}</Typography>
          </FormLabel>
          <Autocomplete multiple freeSolo={canCreateTag} size="small" options={tags.map((tag) => tag.name)} loading={tags_isLoading} value={selectedTags} onChange={(_event, newValue) => setSelectedTags(newValue)} renderTags={(value, getTagProps) => value.map((option, index) => <Chip label={option} {...getTagProps({ index })} size="small" key={index} />)} renderInput={(params) => <TextField {...params} placeholder={canCreateTag ? t("stock.create.tagSearch") : t("stock.create.selectExistingTag")} variant="outlined" helperText={canCreateTag ? undefined : t("stock.create.noTagCreatePermission")} />} />
        </Box>
        <Box>
          <FormLabel sx={{ fontWeight: "bold", fontSize: "0.85rem", mb: 1, display: "block" }}>
            {t("stock.create.description")} <Typography component="span" variant="caption" color="text.secondary">{t("stock.create.optional")}</Typography>
          </FormLabel>
          <TextField fullWidth multiline rows={2} size="small" placeholder={t("stock.create.descriptionPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">{t("stock.create.cancel")}</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!name.trim() || createList.isPending} sx={{ fontWeight: "bold" }}>{createList.isPending ? t("stock.create.creating") : t("stock.create.create")}</Button>
      </DialogActions>
    </Dialog>
  );
};
