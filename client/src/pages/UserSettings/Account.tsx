import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";
import { useForm } from "@tanstack/react-form";
import Loading from "../../components/common/Loading/Loading";
import { Link } from "@tanstack/react-router";
import { accountCustomImageRoute } from "../../routes";

export const Account = () => {
  const {
    user,
    updateAccount,
    updateAccount_isPending,
    successMessage,
    serverError,
    activeIdp,
    activeIdp_isLoading,
    userAvatars,
    switchAvatar,
    switchAvatar_isPending,
    userIdentities, // 追加
    unlink, // 追加
    unlink_isPending,
  } = useAuthQuery();

  const form = useForm({
    defaultValues: {
      username: user?.username ?? "",
    },
    onSubmit: async ({ value }) => {
      await updateAccount(value);
    },
  });
  // localのアバターが存在するかチェック
  const hasLocalAvatar = userAvatars?.some(
    (avatar) => avatar.service_name === "local",
  );
  const isLinked = (providerName: string) => {
    return userIdentities?.some(
      (identity) => identity.identity_providers.provider_name === providerName,
    );
  };
  if (activeIdp_isLoading) return <Loading />;
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
        アカウント
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          使用するアイコン
        </Typography>

        <Grid container spacing={2}>
          {/* 既存のアバター一覧を表示 */}
          {userAvatars?.map((avatar) => (
            <Grid key={avatar.id}>
              {" "}
              {/* itemキーワードを追加してGridを正しく構成 */}
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderColor: avatar.is_selected ? "primary.main" : "divider",
                  bgcolor: avatar.is_selected
                    ? "action.selected"
                    : "background.paper",
                  cursor: "pointer",
                  minWidth: 100,
                }}
                onClick={() => !avatar.is_selected && switchAvatar(avatar.id)}
              >
                <Avatar
                  src={`${avatar.avatar_url}`}
                  sx={{ width: 64, height: 64, mb: 1, bgcolor: "grey.200" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {avatar.service_name}
                </Typography>
                <Radio
                  checked={avatar.is_selected}
                  disabled={switchAvatar_isPending}
                  size="small"
                />

                {/* 【変更点】localの時だけ「更新用」リンクを表示 */}
                {avatar.service_name === "local" && (
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    to={accountCustomImageRoute.to}
                    style={{ fontSize: "0.75rem", marginTop: "4px" }}
                  >
                    画像を変更
                  </Link>
                )}
              </Paper>
            </Grid>
          ))}

          {/* 【変更点】localが存在しない場合のみ、新規作成ボタンを表示 */}
          {!hasLocalAvatar && (
            <Grid>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  width: 100,
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderStyle: "dashed", // 点線にすると「追加」感が出ます
                }}
              >
                <Link
                  to={accountCustomImageRoute.to}
                  style={{
                    textAlign: "center",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                  }}
                >
                  ＋ 画像を
                  <br />
                  アップロード
                </Link>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

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
            name="username"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "ユーザー名を入力してください。"
                  : value.length > 50
                    ? "50文字以内で入力してください。"
                    : undefined,
            }}
            children={(field) => (
              <TextField
                label="ユーザ名"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
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
            disabled={updateAccount_isPending}
            sx={{
              alignSelf: "flex-start",
              mt: 1,
              width: "fit-content",
            }}
          >
            {updateAccount_isPending ? "更新中..." : "更新する"}
          </Button>
        </Stack>
      </form>
      <Divider />
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="h6">外部サービス</Typography>

        {activeIdp?.map((idp) => {
          const linked = isLinked(idp.provider_name);

          return (
            <Button
              key={idp.provider_name}
              size="small"
              variant={linked ? "contained" : "outlined"}
              color={linked ? "error" : "primary"} // 解除は赤色に
              startIcon={
                idp.logo_url ? (
                  <img
                    src={idp.logo_url}
                    alt={idp.display_name}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      filter: linked ? "brightness(0) invert(1)" : "none", // 連携時は白抜き
                    }}
                  />
                ) : null
              }
              // 連携済みなら unlink 関数を呼び、未連携なら href でログインへ飛ばす
              onClick={(e) => {
                if (linked) {
                  e.preventDefault();
                  if (
                    window.confirm(
                      `${idp.display_name} との連携を解除しますか？`,
                    )
                  ) {
                    unlink(idp.provider_name);
                  }
                }
              }}
              href={linked ? undefined : `/auth/${idp.provider_name}/login`}
              disabled={unlink_isPending}
              sx={{
                alignSelf: "flex-start",
                mt: 1,
                width: "fit-content",
              }}
            >
              {linked
                ? `${idp.display_name} との連携を解除する`
                : `${idp.display_name} と連携する`}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
};
