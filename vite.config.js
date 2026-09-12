import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Em servidor próprio ou Vercel o site fica na raiz ("/").
   No GitHub Pages ele fica em /nome-do-repositorio/, e o workflow
   passa esse caminho pela variável BASE_PATH. */
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: { outDir: "dist", sourcemap: false },
});
