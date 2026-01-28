// src/services/song.service.ts
import { SongRepository } from "../repositories/song";
import { Song } from "../models/song.models";

export class SongService {
  private songRepository: SongRepository;

  constructor() {
    this.songRepository = new SongRepository();
  }

  async findAll() {
    return await this.songRepository.getAllSongs();
  }

  async findOne(id: number) {
    const song = await this.songRepository.getSongById(id);
    if (!song) {
      throw new Error(`Le chant avec l'ID ${id} est introuvable.`);
    }
    return song;
  }

  // async create(data: Partial<Song>) {
  //   if (!data.label || data.label.trim() === "") {
  //     throw new Error("Le titre du chant est obligatoire.");
  //   }
  //   return await this.songRepository.createSong(data);
  // }

  async update(id: number, data: Partial<Song>) {
    const updatedSong = await this.songRepository.updateSong(id, data);
    if (!updatedSong) {
      throw new Error(`Impossible de mettre à jour : chant ${id} introuvable.`);
    }
    return updatedSong;
  }

  async remove(id: number) {
    const success = await this.songRepository.deleteSong(id);
    if (!success) {
      throw new Error(`Impossible de supprimer : chant ${id} introuvable.`);
    }
    return { message: "Chant supprimé avec succès." };
  }
}