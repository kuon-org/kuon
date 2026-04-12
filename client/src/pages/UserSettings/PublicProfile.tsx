import {
  Alert,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";
import { useForm } from "@tanstack/react-form";

export const PublicProfile = () => {
  const {
    user,
    updateUserInfo,
    updateUserInfo_isPending,
    successMessage,
    serverError,
  } = useAuthQuery();

  const form = useForm({
    defaultValues: {
      displayName: user?.display_name ?? "",
      bio: user?.bio ?? "",
    },
    onSubmit: async ({ value }) => {
      await updateUserInfo(value);
    },
  });

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
        公開用プロフィール
      </Typography>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Stack spacing={2}>
          {/* displayName フィールド */}
          <form.Field
            name="displayName"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "表示名を入力してください。"
                  : value.length > 50
                    ? "50文字以内で入力してください。"
                    : undefined,
            }}
            children={(field) => (
              <TextField
                label="表示名"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                error={!!field.state.meta.errors.length}
                helperText={field.state.meta.errors.join(", ")}
                fullWidth
              />
            )}
          />

          {/* bio フィールド */}
          <form.Field
            name="bio"
            validators={{
              onChange: ({ value }) =>
                value.length > 200
                  ? "自己紹介は200文字以内で入力してください。"
                  : undefined,
            }}
            children={(field) => (
              <TextField
                label="自己紹介"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                multiline
                minRows={3}
                error={!!field.state.meta.errors.length}
                helperText={field.state.meta.errors.join(", ")}
                fullWidth
              />
            )}
          />

          <Button
            variant="contained"
            size="small"
            type="submit"
            disabled={updateUserInfo_isPending}
            sx={{
              alignSelf: "flex-start",
              mt: 1,
              width: "fit-content",
            }}
          >
            {updateUserInfo_isPending ? "更新中..." : "更新する"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};
