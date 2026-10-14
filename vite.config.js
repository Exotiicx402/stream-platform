import { defineConfig, loadEnv } from "vite";
import handler from "./api/catalog.js";
export default defineConfig(({ mode }) => ({
  plugins: [
    {
      name: "local-catalog-api",
      configureServer(server) {
        const env = loadEnv(mode, process.cwd(), "TMDB_");
        process.env.TMDB_READ_TOKEN = env.TMDB_READ_TOKEN;
        server.middlewares.use("/api/catalog", (req, res) => {
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };
          handler(req, res);
        });
      },
    },
  ],
}));
