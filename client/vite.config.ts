import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@assets": path.resolve(process.cwd(), "../attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
