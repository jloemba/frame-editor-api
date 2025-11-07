import request from "supertest";
import { app } from "../../src/";
import { sequelize } from "../../src/db/connection";
import { Song } from "../../src/models/song.models";

jest.mock("googleapis", () => ({
  google: {
    docs: jest.fn(() => ({
      documents: { batchUpdate: jest.fn().mockResolvedValue({}) },
    })),
    drive: jest.fn(() => ({
      files: { copy: jest.fn().mockResolvedValue({ data: { id: "mock-id" } }) },
      permissions: { create: jest.fn().mockResolvedValue({}) },
    })),
  },
}));

describe("E2E - Generate cult sheet", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await Song.create({
      title: "Louange d’ouverture",
      lyrics: "Béni soit le nom du Seigneur...",
      registry: "001",
      author: "Stéphane Quéry",
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should generate a document successfully", async () => {
    const res = await request(app)
      .post("document/generate")
      .send({
        date: "2025-11-05",
        context: "Culte du Dimanche",
        sections: [
          {
            title: "OUVERTURE DU CULTE",
            songs: [{ id: 1 }],
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.url).toContain("https://docs.google.com/document");
  });
});
