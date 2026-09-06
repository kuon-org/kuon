import ArticleEditor from "../../components/Editor";
import { useCreateArticle } from "../../hooks/articles";

export const New = () => {
  const createArticle = useCreateArticle();

  return (
    <ArticleEditor
      mutate={createArticle.mutateAsync}
      isFetching={createArticle.isPending}
    />
  );
};
