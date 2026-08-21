import { useNavigate } from "@tanstack/react-router";
import Loading from "../../components/common/Loading/Loading";
import ArticleEditor from "../../components/Editor";
import { useArticles } from "../../hooks/useArticles";
import { useNotify } from "../../hooks/useNotify";
import { articleEditRoute } from "../../routes";

export const Edit = () => {
  const { articleId } = articleEditRoute.useParams();
  const { article, isLoading, isOwned, editArticle, isEditing } =
    useArticles(articleId);
  const { error } = useNotify();
  const navigate = useNavigate();
  if (isLoading) return <Loading />;
  if (!isOwned) {
    error("編集権限がありません");
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
