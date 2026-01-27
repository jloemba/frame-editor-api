import { Router } from "express";
import { GoogleDocsService } from "../services/google/googleDocsService";
import { formatDateLongFR } from "../utils";
const router = Router();
const docsService = new GoogleDocsService();

router.post("/generate", async (req, res) => {
  const { date, parts, context } = req.body;

  if (!parts || !Array.isArray(parts)) {
    return res.status(400).json({ error: "Le corps de la requête doit contenir un tableau 'parts'." });
  }
  console.log("Received parts:", parts); 
  console.log("Received date:", date);
  console.log("Received context:", context);
  try {
    const docUrl = await docsService.generateEventDocFromTemplate(formatDateLongFR(date),context, parts);

    res.json({
      message: "Feuille de culte générée avec succès ! 🎶",
      docUrl,
      date,
      partCount: parts.length,
    });
  } catch (err) {
    console.error("Erreur lors de la génération :", err);
    res.status(500).json({ error: "Erreur lors de la génération de la feuille de chant" });
  }
});


export default router;
