import { Router } from "express";
import {createOAuth2Client, generateAuthUrl, getTokenFromCode} from './../services/auth/oauth';

const router = Router();


router.get('/auth', async (req, res) => {
  const oauth2Client = await createOAuth2Client();
  const url = generateAuthUrl(oauth2Client);
  res.redirect(url);
});

router.get('/oauth2callback', async (req, res) => {
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

export default router;
