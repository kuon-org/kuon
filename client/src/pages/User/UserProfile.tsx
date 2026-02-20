import { userRoute } from '../../router'
import { useUserQuery } from '../../hooks/useUsers'
import { Box, Container } from '@mui/material';
import { UserDetailCard } from '../../components/User/UserDetailCard';
import { Outlet } from '@tanstack/react-router';

const UserProfile = () => {
  const { username } = userRoute.useParams();
  const { isLoading } = useUserQuery(username);

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <Container
      sx={{
        mt: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" }, // 👈 画面幅で切り替え！
        gap: { xs: 4, md: 12 }, // 👈 間隔もデバイスに合わせて調整
        alignItems: { xs: "center", md: "flex-start" }, // 👈 スマホ時は中央寄せに
      }}
    >
      {/* ← 左側のプロフィールカード */}
      <UserDetailCard username={username} />

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
