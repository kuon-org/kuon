import { Box } from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";
import { useUserQuery } from "../../hooks/useUsers";
import { userRoute } from "../../routes";
import { PickupArticles } from "./PickupList";
import { UserArticles } from "./UserArticles";
import { useTranslation } from "react-i18next";

export const UserTop = () => {
  const { t } = useTranslation("users");
  const { username } = userRoute.useParams();
  const { user: authUser } = useAuthQuery();
  const { user } = useUserQuery(username);

  const isMe = authUser?.id === user?.id;
  if (!user) return <>{t("profile.notFound")}</>;
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}><PickupArticles userId={user.id} isMe={isMe} /><UserArticles userId={user.id} /></Box>;
};
