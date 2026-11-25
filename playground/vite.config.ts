import solid from "@solidjs/vite-plugin";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "raia-ui": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
});
