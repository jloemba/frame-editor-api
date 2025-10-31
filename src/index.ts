import express from "express";
import generateRouter from "./routes/generate";
import { CONFIG } from "./config/env";
import {createOAuth2Client, generateAuthUrl, getTokenFromCode} from './services/auth/oauth';
import {createGoogleDocFromHtml, uploadDocxBuffer} from './services/drive';


import {Document, Packer, Paragraph, TextRun} from 'docx';

const app = express();
app.use(express.json());

// Route principale
app.use("/generate", generateRouter);

app.get('/auth', async (req, res) => {
  const oauth2Client = await createOAuth2Client();
  const url = generateAuthUrl(oauth2Client);
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).send('Missing code');
  const oauth2Client = await createOAuth2Client();
  try {
    await getTokenFromCode(oauth2Client, code);
    res.send('Authentification réussie — tokens sauvegardés. Tu peux fermer cette page.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l\'échange du code');
  }
});

/**
 * Crée un Google Doc à partir d'un HTML (ex : parole + déroulement)
 * corps attendu: { name: string, html: string }
 */
app.post('/create-google-doc', async (req, res) => {
  try {
    const {name, html} = req.body;
    if (!name || !html) return res.status(400).send('name & html required');
    const oauth2Client = await createOAuth2Client();
    const file = await createGoogleDocFromHtml(oauth2Client, name, html);
    res.json({file});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: String(err)});
  }
});

/**
 * Génère un simple .docx via docx (exemple) et l'upload
 * corps: { name: string, content: string }
 */
app.post('/upload-docx', async (req, res) => {
  try {
    const {name, content} = req.body;
    if (!name || !content) return res.status(400).send('name & content required');
    // exemple simple: créer docx via docx
    const doc = new Document({
      sections: [{
        properties: {},
        children: [ new Paragraph({ children: [ new TextRun(content) ] }) ]
      }]
    });
    const buffer = Buffer.from(await Packer.toBuffer(doc));
    const oauth2Client = await createOAuth2Client();
    const file = await uploadDocxBuffer(oauth2Client, name + '.docx', buffer, false);
    res.json({file});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: String(err)});
  }
});


app.listen(CONFIG.port, () => {
  console.log(`Bienvenue sur CultDoc 🚀 : http://localhost:${CONFIG.port}`);
});
