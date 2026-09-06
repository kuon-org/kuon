import { Container } from "@mui/material";
import Loading from "../../components/common/Loading/Loading";
import { useTagsQuery } from "../../hooks/useTags";
import { tagEditRoute, tagProfileRoute } from "../../routes";
import { TagEditForm } from "./TagEditForm";
import { useAuthUserQuery } from "../../hooks/auth";
import { Navigate } from "@tanstack/react-router";
import { useNotify } from "../../hooks/useNotify";
import { useMyPermissionsQuery } from "../../hooks/roles";
import { useTranslation } from "react-i18next";

export const TagEdit = () => {
  const { t } = useTranslation("tags");
  const { slug } = tagEditRoute.useParams();
  const { tag, tag_isLoading, tag_isError, upsertTag, isUpserting, uploadImage } = useTagsQuery(slug);
  const authUserQuery = useAuthUserQuery();
  const permissionsQuery = useMyPermissionsQuery(!!authUserQuery.data);
  const permissions = permissionsQuery.data?.permissions ?? [];
  const { error } = useNotify();
  const canManageTag = permissions.includes("tag.manage");

  if (permissionsQuery.isLoading) return <Loading />;
  if (!canManageTag) {
    error(t("edit.permissionDenied"));
    return <Navigate to={tagProfileRoute.to} search={{ page: 1 }} params={{ slug }} />;
  }
  if (tag_isLoading) return <Loading />;
  if (tag_isError || !tag) return <>{t("detail.loadError")}</>;

  return (
    <Container>
      <TagEditForm mutate={upsertTag} uploadImage={uploadImage} isPending={isUpserting} oldTag={tag} />
    </Container>
  );
};
