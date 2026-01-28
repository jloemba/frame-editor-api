// src/oauth.ts
// =======================================
// Gère toute la logique OAuth2 avec Google :
// - Création du client OAuth2
// - Génération de l’URL de consentement
// - Récupération et sauvegarde des tokens
// - Rafraîchissement automatique du token
// =======================================

import fs from "fs-extra"; // fs-extra pour lecture/écriture de fichiers
import path from "path"; // Gestion des chemins
import { google } from "googleapis"; // SDK officiel Google API
import type { OAuth2Client, Credentials } from "google-auth-library"; // Types utiles

// Dossier et chemin du fichier où seront stockés les tokens OAuth2
const TOKEN_DIR = path.join(process.cwd(), "tokens");
const TOKEN_PATH = path.join(TOKEN_DIR, "cultedoc-token.json");

// Fichier credentials.json généré depuis Google Cloud Console
// (peut être remplacé par des variables d’environnement)
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

// Structure possible du credentials.json
type CredentialsShape = {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
  web?: { client_id: string; client_secret: string; redirect_uris: string[] };
};

// ------------------------------------------------------------
// 🔧 Fonction utilitaire : charge les identifiants client OAuth2
// ------------------------------------------------------------
async function loadCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}> {
  // Si des variables d'environnement sont définies, on les utilise en priorité
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  ) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    };
  }

  // Sinon, on lit le fichier credentials.json localement
  const raw = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  const parsed: CredentialsShape = JSON.parse(raw);

  // Le credentials peut avoir deux formats possibles ("web" ou "installed")
  const conf = parsed.web ?? parsed.installed;
  if (!conf) throw new Error("credentials.json mal formé");

  return {
    clientId: conf.client_id,
    clientSecret: conf.client_secret,
    redirectUri: conf.redirect_uris[0],
  };
}

// ------------------------------------------------------------
// 🚀 Crée un client OAuth2 et charge les tokens s’ils existent
// ------------------------------------------------------------
export async function createOAuth2Client(): Promise<OAuth2Client> {
  const { clientId, clientSecret, redirectUri } = await loadCredentials();
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // On tente de charger un token existant (si déjà authentifié)
  try {
    const tokenStr = await fs.readFile(TOKEN_PATH, "utf-8");
    const tokens = JSON.parse(tokenStr) as Credentials;
    oAuth2Client.setCredentials(tokens);
  } catch {
    // Pas de token existant : c’est normal si c’est la première connexion
  }

  // 🔄 Auto-sauvegarde des nouveaux tokens lorsqu’ils sont rafraîchis
  oAuth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      // Si on reçoit un refresh_token, on sauvegarde tout
      await saveTokens(tokens);
    } else {
      // Sinon, on ne met à jour que l'access_token et l’expiration
      const existing = await loadTokensSafe();
      const merged = { ...existing, ...tokens };
      await fs.ensureDir(TOKEN_DIR);
      await fs.writeFile(TOKEN_PATH, JSON.stringify(merged, null, 2));
    }
  });

  return oAuth2Client;
}

// ------------------------------------------------------------
// 🌐 Génère l’URL de consentement Google
// ------------------------------------------------------------
export function generateAuthUrl(oauth2Client: OAuth2Client) {
  const SCOPES = [
    "https://www.googleapis.com/auth/drive.file", // Accès limité aux fichiers créés par l’app
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive" // (Optionnel) Accès complet au Drive
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Nécessaire pour recevoir un refresh_token
    scope: SCOPES,
    prompt: "consent", // Forcer Google à redonner un refresh_token (utile en dev)
  });
}

// ------------------------------------------------------------
// 🎫 Échange le code de Google contre des tokens d’accès
// ------------------------------------------------------------
export async function getTokenFromCode(
  oauth2Client: OAuth2Client,
  code: string
) {
  const { tokens } = await oauth2Client.getToken(code); // Échange du code
  oauth2Client.setCredentials(tokens); // Enregistre dans le client
  await saveTokens(tokens); // Sauvegarde sur disque
  return tokens;
}

// ------------------------------------------------------------
// 💾 Sauvegarde les tokens sur le disque (merge si partiel)
// ------------------------------------------------------------
async function saveTokens(tokens: Credentials) {
  await fs.ensureDir(TOKEN_DIR);
  const existing = await loadTokensSafe();
  const merged = { ...existing, ...tokens };
  await fs.writeFile(TOKEN_PATH, JSON.stringify(merged, null, 2));
  //console.log("✅ Tokens sauvegardés dans", TOKEN_PATH);
}

// ------------------------------------------------------------
// 🧩 Lecture sécurisée du fichier de tokens (sans erreur si absent)
// ------------------------------------------------------------
async function loadTokensSafe(): Promise<Credentials> {
  try {
    const t = await fs.readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(t) as Credentials;
  } catch {
    return {};
  }
}
