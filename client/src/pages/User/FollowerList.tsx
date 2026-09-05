import { Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { userRoute } from "../../routes";
import { useUserQuery } from "../../hooks/useUsers";
import { useTranslation } from "react-i18next";

export const FollowerList = () => {
  const { t } = useTranslation("users");
  const { username } = userRoute.useParams();
  const { follower, follower_count } = useUserQuery(username);
  return (
    <Paper sx={{ mx: "auto", width: { xs: "100%", sm: "600px" }, minHeight: "300px", p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{t("followers.title")}</Typography>
      {follower_count === 0 ? (
        <Typography variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary", textAlign: "center" }}>
          {t("followers.empty")}
        </Typography>
      ) : <UserList users={follower} />}
    </Paper>
  );
};
