# API Response Convention

KuonのJSON APIは、Clientや外部利用者が自然言語messageへ依存せず機械的に処理できるよう、以下のレスポンス規約を使用します。

## Error response

HTTP statusが4xx/5xxのJSONレスポンスは必ず次の形式で返します。

```json
{
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found",
    "details": null
  }
}
```

- `code`: Clientが分岐・翻訳に使用する機械可読な識別子。必須。
- `message`: ログ、外部API利用者、デバッグ向けfallback。Client UIのSource of Truthにはしない。
- `details`: validation fieldやpermission等の構造化された追加情報。追加情報がない場合は`null`。

Server内部の例外やPrisma error、stack trace、secretはレスポンスへ含めません。

## Error code naming

error codeは大文字の`UPPER_SNAKE_CASE`を使用します。

ドメイン固有のエラーは対象をprefixとして含めます。

```text
ARTICLE_NOT_FOUND
COMMENT_NOT_FOUND
TAG_NOT_FOUND
USERNAME_ALREADY_EXISTS
PASSWORD_RESET_TOKEN_EXPIRED
EMAIL_VERIFICATION_REQUIRED
```

複数ドメインで共通利用するエラーは共通codeを使用します。

```text
BAD_REQUEST
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
PERMISSION_DENIED
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
SERVICE_UNAVAILABLE
MAINTENANCE_MODE
RUNTIME_MAINTENANCE
```

HTTP statusはエラーの大分類、`code`は具体的な原因の識別に利用します。

## HTTP status

| Status | 用途 |
| --- | --- |
| 400 | request形式、validation |
| 401 | authenticationが必要、認証情報が無効 |
| 403 | authentication済みだがpermission不足 |
| 404 | resourceが存在しない |
| 409 | duplicate、状態競合 |
| 429 | rate limit |
| 500 | 予期しないServer error |
| 503 | maintenance、temporarily unavailable |

## Validation error

field単位のvalidation errorは`VALIDATION_ERROR`と`details.fields`を使用します。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "username": ["USERNAME_TOO_SHORT"],
        "email": ["EMAIL_INVALID"]
      }
    }
  }
}
```

`details.fields`内も可能な限り機械可読なcodeとし、自然言語をClientへ固定しません。

## Server implementation

新しいServerコードでは、Controllerから直接エラーJSONを組み立てず`AppError`をthrowして共通`errorHandler`へ渡します。

```ts
throw new AppError(404, "ARTICLE_NOT_FOUND", "Article not found");
```

既存Controllerに残っている`res.status(...).json(...)`は移行期間中、`normalizeApiErrorResponses` middlewareによって公開レスポンスを標準形式へ正規化します。新規実装ではこの経路を増やさないでください。

## Client implementation

`FetchHttpClient`は4xx/5xxを`ApiError`へ変換します。

```ts
type ApiError = {
  status: number;
  code: string;
  message?: string;
  details?: unknown;
};
```

Client UIでは旧`error.response.data`形式を使用しません。

API由来の表示文言は`code`を基準にClient側で決定します。

```ts
const message = getApiErrorMessage(error, "記事の更新に失敗しました", {
  ARTICLE_NOT_FOUND: "記事が見つかりません",
});
```

#78のi18n導入後は、このmappingをtranslation keyへ置き換えます。

## useNotifyとの関係

`useNotify`はSnackbar/Toastを表示するUI層として維持します。API errorの構造解析や翻訳は`useNotify`へ持たせません。

```text
API
 ↓
FetchHttpClient
 ↓
ApiError
 ↓
error code -> i18n/display message
 ↓
useNotify
```

Client内部で完結する通知は、翻訳済みの文字列を直接`useNotify`へ渡します。

## Success response

成功レスポンスはAPIの性質に応じたdataを返します。すべてを機械的に`{ data: ... }`で包むことはしません。

ページネーションを返すAPIはdataとpagination metadataの境界が明確になる構造を優先します。新規APIで形式を決める際は同一ドメイン内の既存APIと揃えてください。

## Non-JSON responses

以下は通常JSONレスポンスの例外です。

- file download
- image/binary
- stream
- HTML/OGP share response
- redirect

成功時はそれぞれのContent-Typeを使用します。ただしAPI処理中に4xx/5xxとなった場合、可能な限り標準JSON error responseを返します。

`FetchHttpClient`は成功時の`responseType`が`blob`/`text`でも、error時は標準JSON errorを独立してparseします。
