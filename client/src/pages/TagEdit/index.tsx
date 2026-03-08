import { Container } from "@mui/material";
import Loading from "../../components/common/Loading/Loading";
import { useTagsQuery } from "../../hooks/useTags";
import { tagEditRoute, tagProfileRoute } from "../../router";
import { TagEditForm } from "./TagEditForm";
import { useAuthQuery } from "../../hooks/useAuth";
import { Navigate } from "@tanstack/react-router";
import { useNotify } from "../../hooks/useNotify";

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
  const { error } = useNotify();
  const isEditor =
    user?.role === "admin" ? true : user?.role === "moderator" ? true : false;
  if (!isEditor) {
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
