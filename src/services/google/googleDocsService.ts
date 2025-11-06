import { google, docs_v1, drive_v3 } from "googleapis";
import { createOAuth2Client } from "@services/auth/oauth";
import allSongs from "@/fixtures/songs.json";
import dotenv from "dotenv";
import path from "path";
import { CultSectionLabel, CultSubsectionLabel } from "@enums/index";
import { ISection, ISong } from "../../types/index";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export class GoogleDocsService {
  private readonly templateDocId: string;
  private readonly driveFolderId: string;
  private readonly songs: ISong[];
  private docsClient!: docs_v1.Docs;
  private driveClient!: drive_v3.Drive;

  constructor() {
    this.templateDocId = process.env.TEMPLATE_DOC_ID || "";
    this.driveFolderId = process.env.DRIVE_FOLDER_ID || "";
    this.songs = allSongs as ISong[];

    if (!this.templateDocId) {
      throw new Error("❌ TEMPLATE_DOC_ID non défini dans le fichier .env");
    }
    if (!this.driveFolderId) {
      throw new Error("❌ DRIVE_FOLDER_ID non défini dans le fichier .env");
    }
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
            lines.push(this.formatSong(song));
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

  private formatSong(song: ISong): string {
    const title = song.title?.toUpperCase() ?? "CHANT SANS TITRE";
    const author = song.author ? ` (${song.author})` : "";
    return `${title}${author}\n\n${song.lyrics}\n\n`;
  }
}
