import { Container } from "@mui/material";
import Loading from "../../components/common/Loading/Loading";
import { useTagsQuery } from "../../hooks/useTags";
import { tagEditRoute, tagProfileRoute } from "../../routes";
import { TagEditForm } from "./TagEditForm";
import { useAuthQuery } from "../../hooks/useAuth";
import { Navigate } from "@tanstack/react-router";
import { useNotify } from "../../hooks/useNotify";
import { useAdminPermissions } from "../../hooks/useRoles";

export const TagEdit = () => {
  const { slug } = tagEditRoute.useParams();
  const {
    tag,
    tag_isLoading,
    tag_isError,
    upsertTag,
    isUpserting,
    uploadImage,
  } = useTagsQuery(slug);
  const { user } = useAuthQuery();
  const { permissions, permissions_isLoading } = useAdminPermissions(!!user);
  const { error } = useNotify();
  const canManageTag = permissions.includes("tag.manage");

  if (permissions_isLoading) return <Loading />;
  if (!canManageTag) {
    error("権限がありません");
    return (
      <Navigate
        to={tagProfileRoute.to}
        search={{ page: 1 }}
        params={{ slug }}
      />
    );
  }
  if (tag_isLoading) return <Loading />;
  if (tag_isError || !tag) return <>ERROR</>;

  return (
    <Container>
      <TagEditForm
        mutate={upsertTag}
        uploadImage={uploadImage}
        isPending={isUpserting}
        oldTag={tag}
      />
    </Container>
  );
};
