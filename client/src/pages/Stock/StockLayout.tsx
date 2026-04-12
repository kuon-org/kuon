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
import { useStocks } from "../../hooks/useStocks";
import InventoryIcon from "@mui/icons-material/Inventory";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { stocksNewRoute, stocksRoute } from "../../routes";

export const StocksLayout = () => {
  const navigate = useNavigate();
  const { listId } = useParams({ strict: false }); // 現在選択中のIDを取得
  const { lists, isLoading } = useStocks();
  const location = useLocation();
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
      {/* 左側：ストックリスト一覧 */}
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
            ストック
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {/* 🆕 すべての記事（インデックス）へのリンク */}
          <ListItemButton
            selected={!listId && !location.pathname.endsWith("new")} // listId が無い = /stocks にいる
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
              primary="すべてのストック"
              primaryTypographyProps={{
                fontWeight: !listId ? "bold" : "normal",
              }}
            />
          </ListItemButton>
          <ListItemButton onClick={() => navigate({ to: stocksNewRoute.to })}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AddCircleOutlineIcon fontSize="small" color="primary" />
              <ListItemText primary="新しいリストを作成" />
            </Box>
          </ListItemButton>
        </List>
        <Divider />
        <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            ストックリスト
          </Typography>
        </Box>
        {isLoading ? (
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
                  secondary={`${list._count?.stock_items ?? 0} 件の記事`}
                  primaryTypographyProps={{
                    fontWeight: listId === list.id ? "bold" : "normal",
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      {/* 右側：Outlet (各リストの中身) */}
      <Box sx={{ flex: 1, width: "100%" }}>
        <Outlet />
      </Box>
    </Container>
  );
};
