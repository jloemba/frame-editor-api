// tests/integration/songRepository.int.test.ts
import { sequelize } from "../../db/connection";
import { Song } from "../../models/song.models";

describe("SongRepository - Integration", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // recrée la DB
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should create and retrieve a song", async () => {
    const song = await Song.create({
      title: "Béni soit le nom",
      lyrics: "Paroles du chant",
      registry: "001",
      author: "Stéphane Quéry",
    });

    expect(song.id).toBeDefined();

    const found = await Song.findByPk(song.id);
    expect(found?.title).toBe("Béni soit le nom");
  });

  it("should list all songs", async () => {
    const songs = await Song.findAll();
    expect(songs.length).toBeGreaterThan(0);
  });
});
