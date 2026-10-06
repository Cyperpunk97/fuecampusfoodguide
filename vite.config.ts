import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The guide is tested on real phones as well as desktop. Bind development to all
// interfaces so a phone on the same network (and Arena previews) can reach it.
export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: { host: "0.0.0.0" },
  worker: {
    format: "es",
    rollupOptions: { output: { entryFileNames: "workers/[name].js" } },
  },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
