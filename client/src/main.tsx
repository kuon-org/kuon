import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./router";
import { queryClient } from "./utils/queryClient";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeSelectProvider } from "./hooks/useTheme";
import "./index.css";
import { themes } from "./styles/themes";
import { CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "material-symbols";
import "./styles/admonitions.css";
import store from "./store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeSelectProvider themes={themes}>
          <CssBaseline />
          <AppRouter />
        </ThemeSelectProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
