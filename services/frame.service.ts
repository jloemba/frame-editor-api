import { FrameRepository } from "../repositories/frame";
import Frame from "../models/frame.models";
import { GoogleDocsService } from "./google/googleDocsService";

export class FrameService {
  private frameRepository: FrameRepository;
  private googleDocsService: GoogleDocsService;

  constructor() {
    this.frameRepository = new FrameRepository();
    this.googleDocsService = new GoogleDocsService();
  }

  async findAll() {
    return await this.frameRepository.getAllFrames();
  }

  async findById(id: string) {
    const frame = await this.frameRepository.getFrameById(id);
    if (!frame) throw new Error("Trame introuvable");
    return frame;
  }

  async saveFrame(data: any) {
    if (!data.title || !data.eventDate) {
      throw new Error("Le titre et la date sont obligatoires");
    }

    return await this.frameRepository.upsertFrame(data);
  }

  async deleteFrame(id: string) {
    const frame = await this.frameRepository.getFrameById(id);

    if (frame?.docUrl) {
      const deleteResult = await this.googleDocsService.deleteDocumentByDocUrl(
        frame.docUrl,
      );
      if (!deleteResult) {
        throw new Error("Impossible de supprimer le document Google associé");
      }
    }

    const deleted = await this.frameRepository.deleteFrame(id);
    if (!deleted)
      throw new Error("Impossible de supprimer : trame introuvable");
    return { message: "Trame supprimée avec succès" };
  }
}
