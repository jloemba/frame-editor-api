import { Router } from "express";
import songs from "../fixtures/songs.json";
import { GoogleDocsService } from "../services/googleDocsService";

const router = Router();
const docsService = new GoogleDocsService();

/**
 * GET /culte-doc
 * Génère une feuille de chant Google Docs à partir des chants sélectionnés.
 * Exemples :
 *   /culte-doc?date=2025-10-29
 *   /culte-doc?ids=1,3,5
 */
/**
 * GET /culte-doc?ids=1,2,3&date=2025-10-29
 */
router.get("/", async (req, res) => {
  const date = (req.query.date as string) || new Date().toLocaleDateString("fr-FR");

  // Filtrage optionnel par ids
  let selectedSongs = songs;
  const idsQuery = req.query.ids as string;
  console.log(idsQuery);
  if (idsQuery) {
    const ids = idsQuery.split(",").map((id) => parseInt(id, 10));
    selectedSongs = songs.filter((song) => ids.includes(song.id));
  }

  try {
    const docUrl = await docsService.generateCulteDoc(date, selectedSongs);

    console.log(`✅ Feuille de chant générée : ${docUrl}`);
    res.json({
      message: "Feuille de chant générée avec succès ! 🎶",
      docUrl,
      date,
      nombreChants: selectedSongs.length,
    });
  } catch (err) {
    console.error("Erreur lors de la génération :", err);
    res.status(500).json({ error: "Erreur lors de la génération de la feuille de chant" });
  }
});

export default router;
