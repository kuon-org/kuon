// src/pages/Stocks/StockEditWrapper.tsx
import { useParams } from "@tanstack/react-router";
import { useStocks } from "../../hooks/useStocks";
import { StockEditPages } from "./StockEditPages";
import { CircularProgress, Box } from "@mui/material";

export const StockEditWrapper = () => {
  const { listId } = useParams({ strict: false });

  // listId がない場合は「新規作成」なので、何もせずそのまま描画
  if (!listId) {
    return <StockEditPages />;
  }

  // listId がある場合は「編集」なので、データを取得
  return <EditDataLoader listId={listId} />;
};

const EditDataLoader = ({ listId }: { listId: string }) => {
  // listId を渡して詳細データを取得
  const { listDetail, isDetailLoading } = useStocks(undefined, listId);

  if (isDetailLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!listDetail) return <div>リストが見つかりませんでした</div>;

  // 取得したデータを初期値として渡す
  return <StockEditPages initialData={listDetail} />;
};
