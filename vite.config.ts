
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV !== "production"
      ? [runtimeErrorOverlay()]
      : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@server": path.resolve(import.meta.dirname, "server"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            /node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(
              id,
            )
          ) {
            return "react-vendor";
          }

          if (id.includes("node_modules/lucide-react/")) {
            return "icons";
          }

          if (id.includes("node_modules/recharts/")) {
            return "charts";
          }

          if (id.includes("node_modules/@radix-ui/")) {
            return "radix-ui";
          }
        },
      },
    },
  },

  server: {
    proxy: {
      "^/api/.*": {
        target: "http://localhost:2000",
        changeOrigin: true,
        secure: false,
      },
      "/ws/calls": {
        target: "ws://localhost:2000",
        ws: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});