
// =======================================
// Fournit des fonctions simples pour :
// - Créer un document Google Docs depuis du HTML
// - Uploader un fichier .docx dans Google Drive
// =======================================

import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import type { OAuth2Client } from 'google-auth-library';

// ------------------------------------------------------------
// 🔄 Convertit un Buffer en Stream (Drive API attend un flux)
// ------------------------------------------------------------
function streamFromBuffer(buffer: Buffer) {
  const s = new Readable();
  s.push(buffer);
  s.push(null);
  return s;
}

export async function createGoogleDocFromHtml(
  oauth2Client: OAuth2Client,
  name: string,
  htmlContent: string
) {
  // Initialise le client Drive
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Création du document (Drive convertit automatiquement le HTML → Google Doc)
  const res = await drive.files.create({
    requestBody: {
      name, // nom du fichier
      mimeType: 'application/vnd.google-apps.document' // indique qu’on veut un Google Doc
    },
    media: {
      mimeType: 'text/html', // type du contenu envoyé
      body: streamFromBuffer(Buffer.from(htmlContent))
    },
    fields: 'id, name, mimeType, webViewLink' // champs utiles à retourner
  });

  // Renvoie les infos du fichier créé (id, lien, etc.)
  return res.data as drive_v3.Schema$File;
}


export async function uploadDocxBuffer(
  oauth2Client: OAuth2Client,
  name: string,
  buffer: Buffer,
  convertToGoogleDoc = false
) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Prépare les métadonnées du fichier
  const meta: any = { name };
  if (convertToGoogleDoc) {
    // Si on veut que Drive le convertisse en Google Doc
    meta.mimeType = 'application/vnd.google-apps.document';
  } else {
    // Sinon, on garde le fichier Word original
    meta.mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // Upload du fichier
  const res = await drive.files.create({
    requestBody: meta,
    media: {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: streamFromBuffer(buffer)
    },
    fields: 'id, name, mimeType, webViewLink'
  });

  return res.data as drive_v3.Schema$File;
}
