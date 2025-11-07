import express from "express";
import documentRouter from "./routes/document";
import authRouter from "./routes/auth";
import { CONFIG } from "./config/env";
import dotenv from "dotenv";
import { connectDB } from "./db/connection";

import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const app = express();
app.use(express.json());

app.use("/document", documentRouter);
app.use("/auth", authRouter);

(async () => {
  await connectDB();
})();

app.listen(CONFIG.port, () => {
  console.log(`Bienvenue sur CultDoc 🚀 : http://localhost:${CONFIG.port}`);
});
