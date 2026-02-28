// components/layouts/TopBar/TabsBar.tsx
import { AppBar, Toolbar, Tabs, Tab } from "@mui/material";
import { Link, useLocation } from "@tanstack/react-router";

const TabsBar = () => {
  const { pathname } = useLocation();

  let currentValue = "/";
  if (pathname.startsWith("/trend")) {
    currentValue = "/trend";
  } else if (pathname.startsWith("/timeline")) {
    currentValue = "/timeline";
  } else if (pathname.startsWith("/stock-feed")) {
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
            label="トレンド"
            value="/trend"
            component={Link as any}
            to="/trend"
            aria-label="Trend"
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
