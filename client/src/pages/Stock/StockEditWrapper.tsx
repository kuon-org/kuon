import { useParams } from "@tanstack/react-router";
import { CircularProgress, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useStockListDetail } from "../../hooks/stocks";
import { StockEditPages } from "./StockEditPages";

export const StockEditWrapper = () => {
  const { listId } = useParams({ strict: false });
  if (!listId) return <StockEditPages />;
  return <EditDataLoader listId={listId} />;
};

const EditDataLoader = ({ listId }: { listId: string }) => {
  const { t } = useTranslation("articles");
  const listDetail = useStockListDetail(listId);
  if (listDetail.isLoading) return <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}><CircularProgress /></Box>;
  if (!listDetail.data) return <div>{t("stock.notFound")}</div>;
  return <StockEditPages initialData={listDetail.data} />;
};
