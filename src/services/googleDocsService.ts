import { google } from "googleapis";
import { createOAuth2Client } from "../services/auth/oauth";
import allSongs from "../fixtures/songs.json";
import dotenv from "dotenv";
import path from "path";
import { CultSectionLabel, CultSubsectionLabel } from "../enums";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TEMPLATE_DOC_ID = process.env.TEMPLATE_DOC_ID || "";
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || "";

export interface ISongRef { id: number; }
export interface ISubSection { label: string; songs: ISongRef[]; }
export interface ISection { title: string; subSections?: ISubSection[]; songs?: ISongRef[]; }

interface Song { id: number; title: string; lyrics: string; author?: string; choir?: string; }

export class GoogleDocsService {
  async generateCulteDoc(date: string, context: string, sections: ISection[]): Promise<string> {
    if (!TEMPLATE_DOC_ID) throw new Error("TEMPLATE_DOC_ID non défini (env).");
    if (!DRIVE_FOLDER_ID) throw new Error("DRIVE_FOLDER_ID non défini (env).");

    const auth = await createOAuth2Client();
    const docs = google.docs({ version: "v1", auth });
    const drive = google.drive({ version: "v3", auth });

    const formatedDate = new Date(date)
      .toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      .toUpperCase();

    const fullContent = this.generateFullContent(sections);

    // Copier le template
    const copyRes = await drive.files.copy({
      fileId: TEMPLATE_DOC_ID,
      requestBody: { name: `EPE-M ${new Date(date).getFullYear()} - ${formatedDate} - ${context}`, parents: [DRIVE_FOLDER_ID] },
      fields: "id,name"
    });
    const newDocId = copyRes.data.id!;
    console.log(`📄 Template copié : ${newDocId}`);

    // Remplacer les placeholders
    const replaceRequests: any[] = [
      { replaceAllText: { containsText: { text: "{{DATE}}", matchCase: true }, replaceText: formatedDate } },
      { replaceAllText: { containsText: { text: "{{CONTEXT}}", matchCase: true }, replaceText: context } },
      { replaceAllText: { containsText: { text: "{{CONTENT}}", matchCase: true }, replaceText: fullContent } },
    ];

    await docs.documents.batchUpdate({ documentId: newDocId, requestBody: { requests: replaceRequests } });

    // Récupérer le document pour appliquer styles
    const docAfter = await docs.documents.get({ documentId: newDocId });
    const startIndex = this.findInsertionIndexForText(docAfter.data, fullContent) ?? 1;

    //const { sectionRanges, subSectionRanges } = this.findTextRanges(fullContent, startIndex);

    const styleRequests: any[] = [];
    // for (const r of sectionRanges) styleRequests.push({ updateTextStyle: { range: { startIndex: r.start, endIndex: r.end }, textStyle: { bold: true }, fields: "bold" } });
    // for (const r of subSectionRanges) styleRequests.push({ updateTextStyle: { range: { startIndex: r.start, endIndex: r.end }, textStyle: { bold: true }, fields: "bold" } });

    if (styleRequests.length > 0) await docs.documents.batchUpdate({ documentId: newDocId, requestBody: { requests: styleRequests } });

    // Partage public optionnel
    try { await drive.permissions.create({ fileId: newDocId, requestBody: { role: "reader", type: "anyone" } }); } 
    catch (err) { console.warn("⚠️ Impossible de rendre le doc public :", err); }

    const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;
    console.log(`✅ Document généré : ${docUrl}`);
    return docUrl;
  }

  private generateFullContent(sections: ISection[]): string {
    const lines: string[] = [];
    for (const section of sections) {
      if (!Object.values(CultSectionLabel).includes(section.title as CultSectionLabel)) continue;
      lines.push(`${section.title.toUpperCase()}\n\n`);

      if (section.subSections && section.subSections.length > 0) {
        for (const sub of section.subSections) {
          if (!Object.values(CultSubsectionLabel).includes(sub.label as CultSubsectionLabel)) continue;
          lines.push(`• ${sub.label}\n`);
          for (const songRef of sub.songs || []) {
            const song = (allSongs as Song[]).find(s => s.id === songRef.id);
            if (!song) { lines.push(`(Chant introuvable id:${songRef.id})\n\n`); continue; }
            const title = song.title?.toUpperCase() ?? "CHANT SANS TITRE";
            const author = song.author ? ` (${song.author})` : "";
            lines.push(`${title}${author}\n\n${song.lyrics}\n\n`);
          }
        }
      } else if (section.songs && section.songs.length > 0) {
        for (const songRef of section.songs) {
          const song = (allSongs as Song[]).find(s => s.id === songRef.id);
          if (!song) { lines.push(`(Chant introuvable id:${songRef.id})\n\n`); continue; }
          const title = song.title?.toUpperCase() ?? "CHANT SANS TITRE";
          const author = song.author ? ` (${song.author})` : "";
          lines.push(`${title}${author}\n\n${song.lyrics}\n\n`);
        }
      }

      lines.push("\n");
    }

    return lines.join("");
  }

  private findTextRanges(fullContent: string, baseIndex: number) {
    const lines = fullContent.split("\n");
    const sectionRanges: { start: number; end: number }[] = [];
    const subSectionRanges: { start: number; end: number }[] = [];
    let cursor = baseIndex;

    for (const line of lines) {
      const trimmed = line.trim();
      const lenWithNewline = line.length + 1;
      if (!trimmed) { cursor += lenWithNewline; continue; }

      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) sectionRanges.push({ start: cursor, end: cursor + line.length });
      else if (trimmed.startsWith("•")) subSectionRanges.push({ start: cursor, end: cursor + line.length });

      cursor += lenWithNewline;
    }

    return { sectionRanges, subSectionRanges };
  }

  private findInsertionIndexForText(document: any, needle: string): number | null {
    if (!document.body || !Array.isArray(document.body.content)) return null;
    const snippet = needle.slice(0, 60);
    let cursor = 1;
    for (const el of document.body.content) {
      if (!el.paragraph) continue;
      for (const e of el.paragraph.elements || []) {
        const text = e.textRun?.content;
        if (typeof text !== "string") continue;
        const idx = text.indexOf(snippet);
        if (idx !== -1) return cursor + idx;
        cursor += text.length;
      }
    }
    return null;
  }
}
