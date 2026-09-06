import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Loading from "../../components/common/Loading/Loading";
import ArticleEditor from "../../components/Editor";
import {
  useArticleOwnershipQuery,
  useArticleQuery,
  useEditArticle,
} from "../../hooks/articles";
import { useNotify } from "../../hooks/useNotify";
import { articleEditRoute } from "../../routes";

export const Edit = () => {
  const { t } = useTranslation("articles");
  const { articleId } = articleEditRoute.useParams();
  const articleQuery = useArticleQuery(articleId);
  const ownershipQuery = useArticleOwnershipQuery(articleId);
  const editArticle = useEditArticle(articleId);
  const { error } = useNotify();
  const navigate = useNavigate();
  if (articleQuery.isLoading || ownershipQuery.isLoading) return <Loading />;
  if (!ownershipQuery.data?.isOwned) {
    error(t("editor.permissionDenied"));
    navigate({ to: "/" });
  }

  return (
    <ArticleEditor
      article={articleQuery.data}
      mutate={editArticle.mutateAsync}
      isFetching={editArticle.isPending}
    />
  );
};
