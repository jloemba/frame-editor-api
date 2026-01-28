import { google, docs_v1, drive_v3 } from "googleapis";
import { createOAuth2Client } from "../../services/auth/oauth";
import dotenv from "dotenv";
import path from "path";
import { CultPartLabel, CultSubPartLabel, Choirs } from "../../enums/index";
import { IPart, ISong } from "../../types/index";
import { SongRepository } from "../../repositories/song";
import { FrameRepository } from "../../repositories/frame";
import { currentTimestampFR, parseFrenchDate } from "@/utils";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export class GoogleDocsService {
  private readonly templateDocId: string;
  private readonly driveFolderId: string;
  private readonly songRepository!: SongRepository;
  private readonly frameRepository!: FrameRepository;
  private docsClient!: docs_v1.Docs;
  private driveClient!: drive_v3.Drive;
  private songs: ISong[] = [];

  constructor() {
    this.templateDocId = process.env.TEMPLATE_DOC_ID || "";
    this.driveFolderId = process.env.DRIVE_FOLDER_ID || "";
    this.songRepository = new SongRepository();
    this.frameRepository = new FrameRepository();

    if (!this.templateDocId) {
      throw new Error("❌ TEMPLATE_DOC_ID non défini dans le fichier .env");
    }
    if (!this.driveFolderId) {
      throw new Error("❌ DRIVE_FOLDER_ID non défini dans le fichier .env");
    }
  }

  async loadDBSong(): Promise<void> {
    this.songs = await this.songRepository.getAllSongs();
  }

  private async initGoogleClients(): Promise<void> {
    const auth = await createOAuth2Client();
    this.docsClient = google.docs({ version: "v1", auth });
    this.driveClient = google.drive({ version: "v3", auth });
  }

  async generateEventDocFromTemplate(
    formattedDate: string,
    context: string,
    parts: IPart[],
  ): Promise<string> {
    if (this.songs.length === 0) {
      await this.loadDBSong();
    }
    await this.initGoogleClients();

    const fullContent = this.convertStepEventToDocsContent(parts);

    const copyResponse = await this.driveClient.files.copy({
      fileId: this.templateDocId,
      requestBody: {
        name: `${process.env.ORGANISATION_NAME} ${new Date(formattedDate).getFullYear()} - ${formattedDate} - ${context}`,
        parents: [this.driveFolderId],
      },
      fields: "id,name",
    });

    const newDocId = copyResponse.data.id!;

    const replaceRequests: docs_v1.Schema$Request[] = [
      {
        replaceAllText: {
          containsText: { text: "{{DATE}}", matchCase: true },
          replaceText: formattedDate,
        },
      },
      {
        replaceAllText: {
          containsText: { text: "{{CONTEXT}}", matchCase: true },
          replaceText: context,
        },
      },
      {
        replaceAllText: {
          containsText: { text: "{{CONTENT}}", matchCase: true },
          replaceText: fullContent,
        },
      },
    ];

    await this.docsClient.documents.batchUpdate({
      documentId: newDocId,
      requestBody: { requests: replaceRequests },
    });

    try {
      await this.driveClient.permissions.create({
        fileId: newDocId,
        requestBody: { role: "reader", type: "anyone" },
      });
    } catch (err) {
      console.warn("⚠️ Impossible de rendre le doc public :", err);
    }

    const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;

    const formattedDateSql = parseFrenchDate(formattedDate); // "2026-02-08"

    this.frameRepository.upsertFrame({
      title: `${currentTimestampFR()} - CULTE DU ${formattedDate} - ${context}`,
      eventDate: formattedDateSql,
      context,
      content: fullContent,
      docUrl,
    });

    return docUrl;
  }

  private convertStepEventToDocsContent(parts: IPart[]): string {
    const lines: string[] = [];

    for (const part of parts) {
      if (!Object.values(CultPartLabel).includes(part.title as CultPartLabel))
        continue;

      lines.push(`${part.title.toUpperCase()}\n\n`);

      if (part.subPart && part.subPart.length > 0) {
        for (const sub of part.subPart) {
          if (
            !Object.values(CultSubPartLabel).includes(
              sub.label as CultSubPartLabel,
            )
          )
            continue;
          lines.push(`• ${sub.label}\n`);
          for (const songRef of sub.songs || []) {
            const song = this.songs.find((s) => s.id === songRef.id);
            if (!song && !songRef.choir) continue;
            lines.push(this.formatSong(song!, songRef.choir!));
          }
        }
      }

      lines.push("\n");
    }

    return lines.join("");
  }

  private formatSong(song?: ISong, choir?: string): string {
    if (!song && choir) {
      return `• Chant par ${this.prefixChoirPronoun(choir)}\n`;
    }
    const title = song!.title?.toUpperCase() ?? "CHANT SANS TITRE";
    const author = song!.author ? ` (${song!.author})` : "(Auteur inconnu)";
    const choirLabel = choir
      ? `chanté par ${this.prefixChoirPronoun(choir)}`
      : "";
    return `${title}${author} ${choirLabel}\n\n${song!.lyrics}\n\n`;
  }

  private prefixChoirPronoun(choirLabel: string): string {
    switch (choirLabel) {
      case Choirs.PRAISE_AND_WORSHIP_TEAM:
        return "la Praise and Worship Team";
      case Choirs.SEV_LA_SOURCE_D_EAU_VIVE:
        return "la Chorale SEV ‘La Source d’Eau Vive’";
      case Choirs.CHOEUR_DE_CHANTS_DE_REVEIL_CCR_L_EPEE_DE_L_ESPRIT:
        return "le Chœur de chants de réveil CCR ‘L’Épée de l’Esprit’";
      default:
        return "";
    }
  }
  async deleteDocumentByDocUrl(docUrl: string): Promise<boolean> {
    // 1. Extraction sécurisée
    const fileId = docUrl.match(/\/d\/(.*?)(\/|$)/)?.[1];

    if (!fileId) {
      console.warn(
        `Impossible d'extraire l'ID du document depuis l'URL: ${docUrl}`,
      );
      return false;
    }

    try {
      // 2. Initialisation (idéalement vérifier si déjà init)
      await this.initGoogleClients();

      // 3. Action
      await this.driveClient.files.update({
        fileId: fileId,
        requestBody: { trashed: true },
      });

      console.log(`Document mis à la corbeille avec succès : ${fileId}`);
      return true; // Retourne un booléen pour confirmer le succès
    } catch (error) {
      // 4. Log plus précis
      console.error(`Erreur Drive lors de la suppression de ${fileId}:`, error);
      return false;
    }
  }
}
