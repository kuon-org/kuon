import ArticleEditor from "../../components/Editor"
import { useArticles } from "../../hooks/useArticles";



export const New = () => {
    const { createArticle, isCreating } = useArticles();
    
    return (
        <ArticleEditor
            mutate={createArticle}
            isFetching={isCreating}
        />
    )
}