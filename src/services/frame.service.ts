import { FrameRepository } from "../repositories/frame";
import Frame from "../models/frame.models";

export class FrameService {
  private frameRepository: FrameRepository;

  constructor() {
    this.frameRepository = new FrameRepository();
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
    const deleted = await this.frameRepository.deleteFrame(id);
    if (!deleted) throw new Error("Impossible de supprimer : trame introuvable");
    return { message: "Trame supprimée avec succès" };
  }
}