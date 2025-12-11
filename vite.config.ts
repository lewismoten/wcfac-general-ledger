import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const useDevReact = process.env.REACT_DEV === "true";

  return {
    plugins: [react()],
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        useDevReact ? "development" : "production"
      ),
    },
  };
});