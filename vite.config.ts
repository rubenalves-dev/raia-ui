import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [solid(), dts({ include: ["src"] })],
  build: {
    target: "esnext",
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index" },
    rollupOptions: {
      external: [/^solid-js(\/.*)?$/, /^@solidjs\/web(\/.*)?$/],
    },
  },
});
