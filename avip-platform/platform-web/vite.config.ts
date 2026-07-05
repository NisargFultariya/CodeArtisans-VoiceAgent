import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const apiTarget = "http://127.0.0.1:3000";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/admin/api": { target: apiTarget, changeOrigin: true },
      "/portal/api": { target: apiTarget, changeOrigin: true },
      "/portal/grant-access": { target: apiTarget, changeOrigin: true },
      "/api": { target: apiTarget, changeOrigin: true },
      "/health": { target: apiTarget, changeOrigin: true },
      "/demo/grant-access": { target: apiTarget, changeOrigin: true },
      "/demo/access-status": { target: apiTarget, changeOrigin: true },
      "/demo/session": { target: apiTarget, changeOrigin: true },
      "/demo/tts": { target: apiTarget, changeOrigin: true },
      "/demo/transcribe": { target: apiTarget, changeOrigin: true },
      "/demo/transcript-log": { target: apiTarget, changeOrigin: true },
    },
  },
});
