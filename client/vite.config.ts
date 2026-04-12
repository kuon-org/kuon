import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],

  build: {
    minify: "esbuild",
  },
  esbuild: {
    drop: ["console", "debugger"],
  },

  server: {
    host: true,
    port: 5050,
    allowedHosts: ["demo.kuon.f5.si"],
    proxy: {
      "/auth": {
        target: "http://localhost:3030",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "",
      },
      "/api": {
        target: "http://localhost:3030",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "",
      },
      "/uploads": {
        target: "http://localhost:3030",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      host: "localhost",
      protocol: "ws",
    },
  },
});
