import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import federation from "@originjs/vite-plugin-federation";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: "host",
        remotes: {
          vue_analytics: `${env.VITE_VUE_ANALYTICS_URL || "http://localhost:5174"}/assets/remoteEntry.js`,
        },
        shared: ["vue"],
      }),
    ],
    build: {
      target: "esnext",
    },
  };
});
