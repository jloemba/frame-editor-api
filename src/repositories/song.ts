import { Song } from "../models/song.models";

export class SongRepository {
  async getAllSongs() {
    return await Song.findAll();
  }

  async getSongById(id: number) {
    return await Song.findByPk(id);
  }

  async createSong(data: Partial<Song>) {
    return await Song.create(data as any);
  }

  async updateSong(id: number, data: Partial<Song>) {
    const song = await Song.findByPk(id);
    if (!song) return null;
    return await song.update(data);
  }

  async deleteSong(id: number) {
    const song = await Song.findByPk(id);
    if (!song) return null;
    await song.destroy();
    return true;
  }
}
