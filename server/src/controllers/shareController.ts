import { Request, Response } from "express";
import { ArticlesService } from "../services/articlesService.js";

const BASE_URL =
  process.env.APP_SITE_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:3030";
export class ShareController {
  constructor(private articleService: ArticlesService) {}

  sharePage = async (req: Request, res: Response) => {
    const articleId = String(req.params.articleId);

    try {
      // 非公開チェックなどを含めた取得処理
      const article = await this.articleService.getArticle(articleId);
      if (!article) throw new Error("ArticleNotFound");
      // OGP情報生成
      const ogTitle = article.title;
      const ogDesc = article.summary;
      const ogImage = article.users?.avatar_url
        ? `${BASE_URL}${article.users.avatar_url}`
        : `${BASE_URL}/default-ogp.png`; // 画像がない場合の代替
      const ogUrl = `${BASE_URL}/share/${articleId}`;
      const redirect_url =
        process.env.NODE_ENV === "development"
          ? `http://localhost:5050/${article.users!.username}/${articleId}`
          : `/${article.users!.username}/${articleId}`;
      // HTML返却（SNSクローラ用 + JSリダイレクト）
      res.send(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${ogUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <title>${ogTitle}</title>
  <script>
    // 数秒後にSPAのルートにリダイレクト
    window.location.href = "${redirect_url}";
  </script>
</head>
<body>
  <p>記事ページに移動中...</p>
</body>
</html>`);
    } catch (err: any) {
      if (err.message === "ArticleNotFound") {
        return res.status(404).send("記事が見つかりません。");
      } else if (err.message === "Forbidden") {
        return res.status(403).send("この記事は非公開です。");
      }
      console.error(err);
      return res.status(500).send("サーバーエラーが発生しました。");
    }
  };
}
