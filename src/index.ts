import express from "express";
import documentsRouter from "./routes/document";
import authRouter from "./routes/auth";
import { CONFIG } from "./config/env";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
app.use(express.json());

app.use("/documents", documentsRouter);
app.use("/auth", authRouter);

app.listen(CONFIG.port, () => {
  console.log(`Bienvenue sur CultDoc 🚀 : http://localhost:${CONFIG.port}`);
});
