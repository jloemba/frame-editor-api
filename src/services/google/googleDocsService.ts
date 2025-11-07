import { google, docs_v1, drive_v3 } from "googleapis";
import { createOAuth2Client } from "../../services/auth/oauth";
import dotenv from "dotenv";
import path from "path";
import {
  CultSectionLabel,
  CultSubsectionLabel,
  Choirs,
} from "../../enums/index";
import { ISection, ISong } from "../../types/index";
import { SongRepository } from "../../repositories/song";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export class GoogleDocsService {
  private readonly templateDocId: string;
  private readonly driveFolderId: string;
  private readonly songRepository!: SongRepository;
  private docsClient!: docs_v1.Docs;
  private driveClient!: drive_v3.Drive;
  private songs: ISong[] = [];

  constructor() {
    this.templateDocId = process.env.TEMPLATE_DOC_ID || "";
    this.driveFolderId = process.env.DRIVE_FOLDER_ID || "";
    this.songRepository = new SongRepository();

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

  async generateCulteDocFromTemplate(
    formattedDate: string,
    context: string,
    sections: ISection[]
  ): Promise<string> {
    if (this.songs.length === 0) {
      await this.loadDBSong();
    }
    await this.initGoogleClients();

    const fullContent = this.generateFullContent(sections);

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
    return docUrl;
  }

  private generateFullContent(sections: ISection[]): string {
    const lines: string[] = [];

    for (const section of sections) {
      if (
        !Object.values(CultSectionLabel).includes(
          section.title as CultSectionLabel
        )
      )
        continue;

      lines.push(`${section.title.toUpperCase()}\n\n`);

      if (section.subSections && section.subSections.length > 0) {
        for (const sub of section.subSections) {
          if (
            !Object.values(CultSubsectionLabel).includes(
              sub.label as CultSubsectionLabel
            )
          )
            continue;
          lines.push(`• ${sub.label}\n`);
          for (const songRef of sub.songs || []) {
            const song = this.songs.find((s) => s.id === songRef.id);
            if (!song) continue;
            lines.push(this.formatSong(song, songRef.choir!));
          }
        }
      } else if (section.songs && section.songs.length > 0) {
        for (const songRef of section.songs) {
          const song = this.songs.find((s) => s.id === songRef.id);
          if (!song) continue;
          lines.push(this.formatSong(song));
        }
      }

      lines.push("\n");
    }

    return lines.join("");
  }

  private formatSong(song: ISong, choir?: string): string {
    const title = song.title?.toUpperCase() ?? "CHANT SANS TITRE";
    const author = song.author ? ` (${song.author})` : "(Auteur inconnu)";
    const choirLabel = choir ? `chanté par ${this.prefixChoirPronoun(choir)}` : "";
    return `${title}${author} ${choirLabel}\n\n${song.lyrics}\n\n`;
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
}
