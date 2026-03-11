// components/layouts/TopBar/TabsBar.tsx
import { AppBar, Toolbar, Tabs, Tab } from "@mui/material";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  stockListRoute,
  stocksDetailsRoute,
  stocksRoute,
  userStockRoute,
} from "../../../router";

const TabsBar = () => {
  const matchRoute = useMatchRoute();
  let currentValue = "/";

  if (matchRoute({ to: "/trend" })) {
    currentValue = "/trend";
  } else if (matchRoute({ to: "/timeline" })) {
    currentValue = "/timeline";
  } else if (
    matchRoute({ to: stockListRoute.fullPath }) ||
    matchRoute({ to: stocksRoute.fullPath }) ||
    matchRoute({ to: stocksDetailsRoute.fullPath }) ||
    matchRoute({ to: userStockRoute.fullPath })
  ) {
    currentValue = "/stock-feed";
  }
  return (
    <AppBar
      position="sticky"
      color="default"
      sx={{
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        height: "56px",
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <Tabs
          value={currentValue}
          textColor="inherit"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ minHeight: 44 }}
        >
          <Tab
            label="ホーム"
            value="/"
            component={Link as any}
            to="/"
            aria-label="Home"
            sx={{ minHeight: 44 }}
          />
          <Tab
            label="タイムライン"
            value="/timeline"
            component={Link as any}
            to="/timeline"
            aria-label="Timeline"
            sx={{ minHeight: 44 }}
          />
          <Tab
            label="トレンド"
            value="/trend"
            component={Link as any}
            to="/trend"
            aria-label="Trend"
            sx={{ minHeight: 44 }}
          />
          <Tab
            label="ストック"
            value="/stock-feed"
            component={Link as any}
            to="/stock-feed"
            aria-label="Stocks Feed"
            sx={{ minHeight: 44 }}
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default TabsBar;
``;
