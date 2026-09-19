// components/layouts/TopBar/TabsBar.tsx
import { AppBar, Toolbar, Tabs, Tab } from "@mui/material";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  stockListRoute,
  stocksDetailsRoute,
  stocksRoute,
  userStockRoute,
} from "../../../routes";

const TabsBar = () => {
  const { t } = useTranslation("common");
  const matchRoute = useMatchRoute();
  let currentValue = "/";

  if (matchRoute({ to: "/trend" })) {
    currentValue = "/trend";
  } else if (matchRoute({ to: "/timeline" })) {
    currentValue = "/timeline";
  } else if (matchRoute({ to: "/groups", fuzzy: true })) {
    currentValue = "/groups";
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
        zIndex: (theme) => theme.zIndex.appBar,
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
            label={t("navigation.home")}
            value="/"
            component={Link as any}
            to="/"
            aria-label={t("navigation.home")}
            sx={{ minHeight: 44 }}
          />
          <Tab
            label={t("navigation.timeline")}
            value="/timeline"
            component={Link as any}
            to="/timeline"
            aria-label={t("navigation.timeline")}
            sx={{ minHeight: 44 }}
          />
          <Tab
            label={t("navigation.trend")}
            value="/trend"
            component={Link as any}
            to="/trend"
            aria-label={t("navigation.trend")}
            sx={{ minHeight: 44 }}
          />
          <Tab
            label={t("navigation.stocks")}
            value="/stock-feed"
            component={Link as any}
            to="/stock-feed"
            aria-label={t("navigation.stocks")}
            sx={{ minHeight: 44 }}
          />
          <Tab
            label={t("navigation.groups")}
            value="/groups"
            component={Link as any}
            to="/groups"
            search={{ page: 1 }}
            aria-label={t("navigation.groups")}
            sx={{ minHeight: 44 }}
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default TabsBar;
