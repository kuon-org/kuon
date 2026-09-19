import {
  Box,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import InventoryIcon from "@mui/icons-material/Inventory";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useTranslation } from "react-i18next";
import { useStockLists } from "../../hooks/stocks";
import { stocksNewRoute, stocksRoute } from "../../routes";

export const StocksLayout = () => {
  const { t } = useTranslation("articles");
  const navigate = useNavigate();
  const { listId } = useParams({ strict: false });
  const stockLists = useStockLists();
  const location = useLocation();
  const lists = stockLists.data ?? [];

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 4,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, md: 4 },
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: "300px" },
          minWidth: { xs: "100%", md: "300px" },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            {t("stock.title")}
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          <ListItemButton
            selected={!listId && !location.pathname.endsWith("new")}
            onClick={() =>
              navigate({
                to: stocksRoute.to,
                search: { page: 1, q: undefined },
              })
            }
            sx={{
              borderLeft: !listId ? "4px solid" : "4px solid transparent",
              borderColor: "primary.main",
            }}
          >
            <ListItemText
              primary={t("stock.all")}
              primaryTypographyProps={{
                fontWeight: !listId ? "bold" : "normal",
              }}
            />
          </ListItemButton>
          <ListItemButton onClick={() => navigate({ to: stocksNewRoute.to })}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AddCircleOutlineIcon fontSize="small" color="primary" />
              <ListItemText primary={t("stock.newList")} />
            </Box>
          </ListItemButton>
        </List>
        <Divider />
        <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            {t("stock.listTitle")}
          </Typography>
        </Box>
        {stockLists.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            <Divider sx={{ my: 1 }} />
            {lists.map((list) => (
              <ListItemButton
                key={list.id}
                selected={listId === list.id}
                onClick={() => navigate({ to: `/stocks/${list.id}` })}
                sx={{
                  borderLeft:
                    listId === list.id ? "4px solid" : "4px solid transparent",
                  borderColor: "primary.main",
                }}
              >
                <ListItemText
                  primary={list.name}
                  secondary={t("stock.articleCountLong", {
                    count: list._count?.stock_items ?? 0,
                  })}
                  primaryTypographyProps={{
                    fontWeight: listId === list.id ? "bold" : "normal",
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
      <Box sx={{ flex: 1, width: "100%" }}>
        <Outlet />
      </Box>
    </Container>
  );
};
