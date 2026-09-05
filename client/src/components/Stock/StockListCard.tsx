import { Card, CardContent, Typography, Avatar, Box, CardActionArea } from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import ArticleIcon from "@mui/icons-material/Article";
import { useTranslation } from "react-i18next";
import { TagChip } from "../common/TagChip";
import { userStockRoute } from "../../routes";

export const StockListCard = ({ list }: { list: any }) => {
  const { t, i18n } = useTranslation("articles");
  const formattedDate = new Date(list.created_at).toLocaleString(i18n.language);
  const stopPropagation = (event: React.MouseEvent) => event.stopPropagation();
  const navigate = useNavigate();
  const handleUserStock = () => navigate({ to: userStockRoute.to, params: { username: list.users.username, listId: list.id } });

  return (
    <Box sx={{ position: "relative", mt: 2, mb: 3 }}>
      <Card variant="outlined" sx={{ position: "absolute", top: 4, left: "2%", width: "96%", height: "100%", zIndex: 1, borderRadius: 2, bgcolor: "background.paper", pointerEvents: "none" }} />
      <Card variant="outlined" sx={{ position: "absolute", top: 8, left: "4%", width: "92%", height: "100%", zIndex: 0, borderRadius: 2, bgcolor: "background.paper", pointerEvents: "none" }} />
      <Card variant="outlined" sx={{ position: "relative", zIndex: 2, cursor: "pointer", borderRadius: 2, width: "auto", transition: "transform 0.2s, background-color 0.2s", "&:hover": { transform: "translateY(-2px)" }, "@media (max-width:600px)": { width: "100vw", borderRadius: 0, mx: "-16px", transform: "none !important" } }}>
        <CardActionArea onClick={handleUserStock}><CardContent><Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}><Link to="/$username" params={{ username: list.users.username }} style={{ textDecoration: "none", color: "inherit" }} onClick={stopPropagation}><Avatar src={list.users.avatar_url} alt={list.users.display_name} sx={{ width: 32, height: 32, bgcolor: "grey.200" }} /></Link><Box sx={{ flex: 1, minWidth: 0 }}><Link to="/$username" params={{ username: list.users.username }} style={{ textDecoration: "none", color: "inherit" }} onClick={stopPropagation}><Box sx={{ display: "inline-block", "&:hover": { textDecoration: "underline" } }}><Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>@{list.users.username} ({list.users.display_name})</Typography></Box></Link><Typography variant="caption" color="text.secondary" display="block">{formattedDate}</Typography></Box></Box>
          <Box sx={{ px: { xs: 0, sm: 6 } }}><Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5, lineHeight: 1.3 }}>{list.name}</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{list.description || t("stock.noDescription")}</Typography><Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}><ArticleIcon fontSize="small" color="action" /><Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold" }}>{t("stock.articleCount", { count: list._count?.stock_items ?? 0 })}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", ml: 1 }}>♡ {list._count?.stock_list_likes ?? 0}</Typography></Box><Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }} onClick={stopPropagation}>{list.stock_list_tags.map((tagItem: any) => <TagChip key={tagItem.tags.id} tag={tagItem.tags} />)}</Box></Box>
        </Box></CardContent></CardActionArea>
      </Card>
    </Box>
  );
};
