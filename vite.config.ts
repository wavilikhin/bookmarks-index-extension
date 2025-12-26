import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Extension build configuration
  build: {
    // Output to dist folder (default)
    outDir: "dist",
    // Use relative paths for assets (required for extensions)
    assetsDir: "assets",
    // Generate sourcemaps for debugging
    sourcemap: process.env.NODE_ENV === "development",
    rollupOptions: {
      output: {
        // Ensure consistent file names for extension caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  // Base path for extension (empty string for relative paths)
  base: "",
});
