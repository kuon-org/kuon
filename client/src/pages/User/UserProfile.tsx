import { userRoute } from "../../routes";
import { useUserQuery } from "../../hooks/useUsers";
import { Box, Container } from "@mui/material";
import { UserDetailCard } from "../../components/User/UserDetailCard";
import { Outlet } from "@tanstack/react-router";
import { FollowingTags } from "./FollowingTags";

const UserProfile = () => {
  const { username } = userRoute.useParams();
  const { user, isLoading } = useUserQuery(username);

  if (isLoading) return <div>読み込み中...</div>;
  if (!user) return <>ユーザが見つかりません</>;
  return (
    <Container
      sx={{
        mt: 2,
        display: "flex",
        flexDirection: { xs: "column", sm: "center", md: "row" }, // 👈 画面幅で切り替え！
        gap: 4,
        alignItems: { xs: "center", sm: "center", md: "flex-start" }, // 👈 スマホ時は中央寄せに
      }}
    >
      {/* ← 左側のプロフィールカード */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <UserDetailCard username={username} />
        <FollowingTags userId={user.id} username={username} />
      </Box>
      {/* → 右側の切り替えセクション */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: { xs: "100%", md: "auto" }, // 👈 スマホでは幅いっぱいに
        }}
      >
        <Outlet />
      </Box>
    </Container>
  );
};

export default UserProfile;
