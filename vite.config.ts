import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/y-app-keukenblad-opname/",
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
});
