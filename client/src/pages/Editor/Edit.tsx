import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Loading from "../../components/common/Loading/Loading";
import ArticleEditor from "../../components/Editor";
import { useArticles } from "../../hooks/useArticles";
import { useNotify } from "../../hooks/useNotify";
import { articleEditRoute } from "../../routes";

export const Edit = () => {
  const { t } = useTranslation("articles");
  const { articleId } = articleEditRoute.useParams();
  const { article, isLoading, isOwned, editArticle, isEditing } =
    useArticles(articleId);
  const { error } = useNotify();
  const navigate = useNavigate();
  if (isLoading) return <Loading />;
  if (!isOwned) {
    error(t("editor.permissionDenied"));
    navigate({ to: "/" });
  }

  return (
    <ArticleEditor
      article={article}
      mutate={editArticle}
      isFetching={isEditing}
    />
  );
};
