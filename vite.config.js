// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // ← tell Vite “assets are next to index.html”
  plugins: [react()],
  build: {
    outDir: "dist", // you already have this
  },
});
