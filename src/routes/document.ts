import { Router } from "express";
import { GoogleDocsService } from "../services/google/googleDocsService";
import { formatDateLongFR } from "../utils";
const router = Router();
const docsService = new GoogleDocsService();

router.post("/generate", async (req, res) => {
  const { date, sections, context } = req.body;

  if (!sections || !Array.isArray(sections)) {
    return res.status(400).json({ error: "Le corps de la requête doit contenir un tableau 'sections'." });
  }

  try {
    const docUrl = await docsService.generateCulteDocFromTemplate(formatDateLongFR(date),context, sections);

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
