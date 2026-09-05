import { useParams } from "@tanstack/react-router";
import { CircularProgress, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useStocks } from "../../hooks/useStocks";
import { StockEditPages } from "./StockEditPages";

export const StockEditWrapper = () => {
  const { listId } = useParams({ strict: false });
  if (!listId) return <StockEditPages />;
  return <EditDataLoader listId={listId} />;
};

const EditDataLoader = ({ listId }: { listId: string }) => {
  const { t } = useTranslation("articles");
  const { listDetail, isDetailLoading } = useStocks(undefined, listId);
  if (isDetailLoading) return <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}><CircularProgress /></Box>;
  if (!listDetail) return <div>{t("stock.notFound")}</div>;
  return <StockEditPages initialData={listDetail} />;
};
