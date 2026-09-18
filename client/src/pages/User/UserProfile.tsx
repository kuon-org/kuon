import { userRoute } from "../../routes";
import { useUserQuery } from "../../hooks/users";
import { Box, Container } from "@mui/material";
import { UserDetailCard } from "../../components/User/UserDetailCard";
import { Outlet } from "@tanstack/react-router";
import { FollowingTags } from "./FollowingTags";
import { useTranslation } from "react-i18next";
import { UserGroups } from "./UserGroups";

const UserProfile = () => {
  const { t } = useTranslation("users");
  const { username } = userRoute.useParams();
  const userQuery = useUserQuery(username);
  const user = userQuery.data;

  if (userQuery.isLoading) return <div>{t("profile.loading")}</div>;
  if (!user) return <>{t("profile.notFound")}</>;
  return (
    <Container
      sx={{
        mt: 2,
        display: "flex",
        flexDirection: { xs: "column", sm: "center", md: "row" },
        gap: 4,
        alignItems: { xs: "center", sm: "center", md: "flex-start" },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <UserDetailCard username={username} />
        <FollowingTags userId={user.id} username={username} />
        <UserGroups userId={user.id} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: { xs: "100%", md: "auto" } }}>
        <Outlet />
      </Box>
    </Container>
  );
};

export default UserProfile;
