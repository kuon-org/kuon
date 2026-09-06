# Client API / TanStack Query 設計ガイド

Kuon ClientでAPI通信とTanStack Queryを追加・変更する場合の基本方針をまとめます。

## 基本構成

ドメインごとに、API通信とReact Hookを分離します。

```text
client/src/
  api/
    stocks.ts
    articles.ts
    users.ts

  hooks/
    stocks/
      keys.ts
      queries.ts
      mutations.ts
      index.ts
```

依存方向は以下を基本とします。

```text
Component
  ↓
TanStack Query Hook
  ↓
API function
  ↓
FetchHttpClient
  ↓
Server
```

## API function

`client/src/api/<domain>.ts`にはReactに依存しないAPI通信だけを置きます。

- `useQuery` / `useMutation`を呼ばない
- `useNotify`などReact Hookを呼ばない
- HTTP request / responseの型を定義する
- Componentから直接呼ぶのではなく、原則Query / Mutation Hookを経由する

```ts
export const fetchStockLists = async (articleId?: string) => {
  const { data } = await apiClient.get("/stocks/mylists", {
    params: articleId ? { articleId } : {},
  });
  return data;
};
```

## Query Key

Query Keyはドメインごとの`keys.ts`へ集約します。

```ts
export const stockKeys = {
  all: ["stocks"] as const,
  lists: () => [...stockKeys.all, "lists"] as const,
  articleLists: (articleId?: string) =>
    [...stockKeys.lists(), "article", articleId] as const,
};
```

ComponentやMutation内で同じQuery Key配列を繰り返し手書きしないでください。

Query Keyは、親Keyをinvalidateしたときに関連Queryをまとめて扱える階層構造を意識します。

## Query Hook

`queries.ts`では1 Hook = 1つの明確なQuery責務を基本とします。

```ts
export const useStockLists = () =>
  useQuery({
    queryKey: stockKeys.lists(),
    queryFn: fetchStockLists,
  });
```

複数APIをまとめて取得する巨大Hookは作りません。

以下のようなHookは避けます。

```ts
// NG
const {
  lists,
  detail,
  isLiked,
  createList,
  deleteList,
} = useStocks(articleId, listId);
```

利用側で必要なHookだけを直接組み合わせます。

```ts
const stockLists = useStockLists();
const stockDetail = useStockListDetail(listId);
const createStockList = useCreateStockList();
```

## Composite Hook

複数Query / MutationをまとめるComposite Hookは原則作りません。

Composite Hookは利用側から依存関係が見えにくくなり、不要なQueryやMutation stateにもsubscribeしやすいためです。

必要なHookをComponent側で直接組み合わせてください。

## enabled

引数が未確定、Dialogが閉じている、未ログインなど、Queryを実行する必要がない状態では`enabled`を使用します。

```ts
useQuery({
  queryKey: stockKeys.articleLists(articleId),
  queryFn: () => fetchStockLists(articleId!),
  enabled: dialogOpen && !!articleId,
});
```

一覧上の各Cardから詳細APIを自動的に呼ぶような構成は避けます。

## Mutation

Mutationは`mutations.ts`へ分離します。

Mutation成功後は、影響を受けるCacheだけを更新してください。

### invalidateQueries

Server側の結果を再取得する必要がある場合に利用します。

```ts
await queryClient.invalidateQueries({
  queryKey: stockKeys.lists(),
});
```

必要以上に大きいKeyをinvalidateしないようにします。

### setQueryData

Mutation結果からCacheの次状態を安全に決定できる場合は`setQueryData`を優先できます。

```ts
queryClient.setQueryData(stockKeys.articleLists(articleId), nextValue);
```

これにより不要な再fetchを避けられます。

## Query object

利用側では、必要以上に大量destructuringせずTanStack Queryのobjectをそのまま扱う形も推奨します。

```ts
const stockLists = useStockLists();
const createStockList = useCreateStockList();

stockLists.data;
stockLists.isLoading;
createStockList.mutate();
createStockList.isPending;
```

HookがQueryなのかMutationなのかも利用側から分かりやすくなります。

## index.ts

各ドメインの`index.ts`から公開Hookと型をexportします。

利用側は原則として内部ファイルを直接参照せず、ドメインrootからimportします。

```ts
import {
  useStockLists,
  useCreateStockList,
} from "@/hooks/stocks";
```

## 命名

- React Component: PascalCase
- Hook / function / variable: camelCase
- 新しく追加するClientの一般ファイル・ディレクトリ: kebab-caseを基本とする
- Query Hook: `useXxxQuery`または取得対象が明確な`useXxx`
- Mutation Hook: 操作が分かる`useCreateXxx`, `useUpdateXxx`, `useDeleteXxx`, `useToggleXxx`

既存コードを変更する際は、機能変更と無関係な大量renameを同時に行う必要はありません。

## 新規実装時の確認

新しいClient API連携を追加するときは以下を確認します。

- API通信がReact Hookから分離されている
- Query Keyが`keys.ts`に定義されている
- QueryとMutationが分離されている
- Hookの責務が1 Query / Mutationとして説明できる
- 不要なタイミングでQueryが走らないよう`enabled`を設定している
- Mutation後のinvalidate範囲が必要最小限になっている
- `setQueryData`で更新可能なCacheを無意味に再fetchしていない
- 巨大Hook / Composite Hookで依存を隠していない
- Componentから`apiClient`を直接呼んでいない
- `pnpm typecheck`が通る
