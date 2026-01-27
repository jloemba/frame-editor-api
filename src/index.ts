import express from "express";
import documentRouter from "./routes/document";
import authRouter from "./routes/auth";
import songRouter from "./routes/song";
import frameRouter from "./routes/frames";
import { CONFIG } from "./config/env";
import dotenv from "dotenv";
import { connectDB } from "./db/connection";
import cors from "cors";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
export const app = express();

app.use(
  cors({
    origin: CONFIG.corsOrigin, // L'URL de ton appli React
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/document", documentRouter);
app.use("/auth", authRouter);
app.use("/song", songRouter);
app.use("/frame", frameRouter);

(async () => {
  await connectDB();
})();

app.listen(CONFIG.port, () => {
  console.log(`Bienvenue sur CultDoc 🚀 : http://localhost:${CONFIG.port}`);
});
