// src/routes/frame.routes.ts
import { Router, Request, Response } from "express";
import { FrameService } from "../services/frame.service";

const router = Router();
const frameService = new FrameService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const frames = await frameService.findAll();
    res.json(frames);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const frame = await frameService.findById(req.params.id);
    res.json(frame);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await frameService.saveFrame(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await frameService.deleteFrame(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;