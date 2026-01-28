import Frame from "../models/frame.models";

export class FrameRepository {

  async getAllFrames(): Promise<Frame[]> {
    return await Frame.findAll({
      order: [["eventDate", "DESC"]],
    });
  }

  async getFrameById(id: string): Promise<Frame | null> {
    return await Frame.findByPk(id);
  }

  async upsertFrame(data: any): Promise<[Frame, boolean | null]> {
    return await Frame.upsert(data, {
      returning: true, // Necessary to get the instance back on Postgres
    });
  }

  async deleteFrame(id: string): Promise<number> {
    return await Frame.destroy({
      where: { id },
    });
  }


  async searchByTitle(term: string): Promise<Frame[]> {
    const { Op } = require("sequelize");
    return await Frame.findAll({
      where: {
        title: {
          [Op.iLike]: `%${term}%`,
        },
      },
      order: [["eventDate", "DESC"]],
    });
  }
}