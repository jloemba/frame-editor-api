import { Router } from "express";
import { GoogleDocsService } from "../services/googleDocsService";
import { formatDateLongFR } from "../utils";
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
router.post("/", async (req, res) => {
  const { date, sections, context } = req.body;

  if (!sections || !Array.isArray(sections)) {
    return res.status(400).json({ error: "Le corps de la requête doit contenir un tableau 'sections'." });
  }

  try {
    const docUrl = await docsService.generateCulteDoc(formatDateLongFR(date),context, sections);

    res.json({
      message: "Feuille de culte générée avec succès ! 🎶",
      docUrl,
      date,
      nombreSections: sections.length,
    });
  } catch (err) {
    console.error("Erreur lors de la génération :", err);
    res.status(500).json({ error: "Erreur lors de la génération de la feuille de chant" });
  }
});


export default router;
