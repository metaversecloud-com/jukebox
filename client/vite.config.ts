import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from 'dotenv'

dotenv.config()
// https://vitejs.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT as string) || 3001,
    proxy: {
      "/api": "http://localhost:3000/",
    },
  },
  build: {
    outDir: "./build",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@pages": path.resolve(__dirname, "./src/pages"),
    },
  }
});
