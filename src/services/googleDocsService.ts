import { google } from "googleapis";
import { createOAuth2Client } from "./auth/oauth";

export class GoogleDocsService {
  
  private readonly templateId: string = process.env.TEMPLATE_DOC_ID || ""; 
  private readonly folderId: string = process.env.DRIVE_FOLDER_ID || "";

  async generateCulteDoc(formatedDate: string, songs: any[]) { 
    const auth = await createOAuth2Client();
    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });

    // 1️⃣ Copier le modèle dans le dossier de destination
    const copy = await drive.files.copy({
      fileId: this.templateId,
      requestBody: {
        name: `${formatedDate} – CANTIQUES DU CULTE`,
        parents: [this.folderId],
      },
      fields: "id",
    });

    const newDocId = copy.data.id!;
    console.log(`✅ Modèle copié → Nouveau document ID: ${newDocId}`);

    // 2️⃣ Récupérer le document pour connaître la longueur
    const doc = await docs.documents.get({ documentId: newDocId });
    const endIndex = doc.data.body!.content!.reduce(
      (acc, el) => acc + (el.endIndex || 0) - (el.startIndex || 0),
      0
    );
    const hymnContent = this.buildSongText(songs);

    // 3️⃣ Remplacer la balise {{DATE}}
    await docs.documents.batchUpdate({
      documentId: newDocId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: { text: "{{DATE}}", matchCase: true },
              replaceText: formatedDate,
            },
          },
        ],
      },
    });

    // 2️⃣ Insérer le texte
    await docs.documents.batchUpdate({
      documentId: newDocId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndex },
              text: hymnContent,
            },
          },
        ],
      },
    });

await docs.documents.batchUpdate({
  documentId: newDocId,
  requestBody: {
    requests: [
      {
        updateTextStyle: {
          range: {
            startIndex: endIndex,
            endIndex: endIndex + hymnContent.length,
          },
          textStyle: {
            weightedFontFamily: {
              fontFamily: "Century Gothic",
              weight: 400
            },
            fontSize: {
              magnitude: 18,
              unit: "PT"
            }
          },
          fields: "weightedFontFamily,fontSize",
        },
      },
    ],
  },
});

    // 5️⃣ Retourner le lien du document final
    const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;
    console.log(`✅ Feuille de chant générée : ${docUrl}`);
    return docUrl;
  }

  // 💬 Génère un texte simple pour les chants
  private buildSongText(songs: any[]) {
    return songs
      .map(
        (song: any, index: number) =>
          `${index + 1}. ${song.title}\n${song.lyrics}\n`
      )
      .join("\n");
  }
}
