import path from "node:path";
import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
  ],
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing vendor libraries out of the main entry chunk so they cache
        // independently and the initial bundle shrinks. (Charts/recharts are already split by their
        // own route.)
        manualChunks: {
          tanstack: [
            "@tanstack/react-query",
            "@tanstack/react-router",
          ],
          motion: ["framer-motion"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
