import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^gsap$/,
        replacement: path.resolve(__dirname, "node_modules/gsap/index.js"),
      },
      {
        find: /^gsap\/ScrollTrigger$/,
        replacement: path.resolve(__dirname, "node_modules/gsap/ScrollTrigger.js"),
      },
    ],
  },
  optimizeDeps: {
    include: ["gsap", "gsap/ScrollTrigger"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
