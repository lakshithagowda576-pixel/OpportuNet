import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";

/** Next.js-only directive; strip so Vite production builds stay clean. */
function stripUseClient(): Plugin {
  return {
    name: "strip-use-client",
    enforce: "pre",
    transform(code, id) {
      if (!/\.[tj]sx?$/.test(id)) return;
      const stripped = code.replace(/^\s*["']use client["'];?\s*\r?\n/, "");
      if (stripped !== code) return { code: stripped, map: null };
    },
  };
}

export default defineConfig({
  base: basePath,
  envDir: path.resolve(import.meta.dirname, "../../"),
  plugins: [
    stripUseClient(),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: "../../public",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    reportCompressedSize: false,
  },
  logLevel: "info",
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3008",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
