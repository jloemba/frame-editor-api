// src/routes/songs.ts
import { Router } from "express";
import { SongService } from "../services/song.service";

const router = Router();
const songService = new SongService();

router.get("/", async (req, res) => {
  try {
    const songs = await songService.findAll();
    res.json(songs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// router.post("/", async (req, res) => {
//   try {
//     const newSong = await songService.create(req.body);
//     res.status(201).json(newSong);
//   } catch (error: any) {
//     res.status(400).json({ message: error.message });
//   }
// });

router.get("/:id", async (req, res) => {
  try {
    const song = await songService.findOne(Number(req.params.id));
    res.json(song);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
