import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handleApiRequest } from "./server/api.ts";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Mount API routes
app.use("/api", async (req, res, next) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) next();
});

// Serve static assets from dist in production
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Fallback to index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Voice Sales Bot server listening on port ${PORT}`);
});
