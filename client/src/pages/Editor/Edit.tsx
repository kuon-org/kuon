import Loading from "../../components/common/Loading/Loading";
import ArticleEditor from "../../components/Editor";
import { useArticles } from "../../hooks/useArticles";
import { articleEditRoute } from "../../routes";

export const Edit = () => {
  const { articleId } = articleEditRoute.useParams();
  const { article, isLoading, isOwned, editArticle, isEditing } =
    useArticles(articleId);
  if (isLoading) return <Loading />;
  if (!isOwned) return <>編集権限がありません</>;
  return (
    <ArticleEditor
      article={article}
      mutate={editArticle}
      isFetching={isEditing}
    />
  );
};
