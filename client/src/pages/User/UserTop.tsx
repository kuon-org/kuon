import { Box } from "@mui/material";
import { useAuthUserQuery } from "../../hooks/auth";
import { useUserQuery } from "../../hooks/users";
import { userRoute } from "../../routes";
import { PickupArticles } from "./PickupList";
import { UserArticles } from "./UserArticles";
import { useTranslation } from "react-i18next";

export const UserTop = () => {
  const { t } = useTranslation("users");
  const { username } = userRoute.useParams();
  const authUserQuery = useAuthUserQuery();
  const userQuery = useUserQuery(username);
  const user = userQuery.data;

  const isMe = authUserQuery.data?.id === user?.id;
  if (!user) return <>{t("profile.notFound")}</>;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PickupArticles userId={user.id} isMe={isMe} />
      <UserArticles userId={user.id} />
    </Box>
  );
};
