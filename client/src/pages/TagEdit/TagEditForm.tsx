import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import { type UpsertTagData } from "../../hooks/useTags";
import { useForm } from "@tanstack/react-form";
import {
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNotify } from "../../hooks/useNotify";
import { useRouter } from "@tanstack/react-router";
import React, { useRef, useState } from "react";
interface TagEditFormProps {
  mutate: UseMutateAsyncFunction<any, any, UpsertTagData, unknown>;
  uploadImage: UseMutateAsyncFunction<any, any, File, unknown>;
  isPending: boolean;
  oldTag: UpsertTagData;
}
export const TagEditForm = ({
  mutate,
  uploadImage,
  isPending,
  oldTag,
}: TagEditFormProps) => {
  const { notify } = useNotify();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resUrl, setResUrl] = useState<string | null>(
    oldTag.avatar_url || null,
  );
  const form = useForm({
    defaultValues: {
      name: oldTag.name ?? "",
      slug: oldTag.slug ?? "",
      description: oldTag.description ?? "",
    },
    onSubmit: async ({ value }) => {
      const data = {
        ...value,
        avatar_url: resUrl,
      };
      await mutate(data, {
        onSuccess: () => {
          notify("タグを更新しました");
          router.history.back();
        },
      });
    },
  });
  console.log(resUrl);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        // uploadImage が URL を含むオブジェクトを返すと仮定
        const data = await uploadImage(file);
        setResUrl(data.url);
      } catch (error) {
        notify("画像のアップロードに失敗しました");
      }
    }
  };
  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Paper
      sx={{
        mx: "auto",
        flex: 1,
        p: 3,
        minWidth: { xs: "100%", sm: "100%", md: "600px", lg: "850px" },
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        {oldTag.name}の編集
      </Typography>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Stack spacing={2}>
          <form.Field
            name="name"
            children={(field) => (
              <TextField
                label="表示名"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                fullWidth
              />
            )}
          />
          <form.Field
            name="slug"
            children={(field) => (
              <TextField
                label="識別子"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                fullWidth
              />
            )}
          />
          <Box onClick={handleBoxClick}>
            <Avatar
              src={resUrl || undefined}
              alt="tagAvatar"
              sx={{
                width: "48px",
                height: "48px",
                bgcolor: "grey.200",
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </Box>
          <form.Field
            name="description"
            children={(field) => (
              <TextField
                label="タグの説明"
                multiline
                minRows={3}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                fullWidth
              />
            )}
          />
          <Button
            variant="contained"
            size="small"
            type="submit"
            disabled={isPending}
            sx={{
              alignSelf: "flex-start",
              mt: 1,
              width: "fit-content",
            }}
          >
            {isPending ? "更新中..." : "更新する"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};
