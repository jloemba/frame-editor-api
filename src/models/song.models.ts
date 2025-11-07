// src/models/song.model.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Song extends Model {
  declare id: number;
  declare title: string;
  declare lyrics: string;
  declare registry: string;
  declare author?: string;
  declare informations?: string;
  declare status?: string;
  declare createdAt?: string;
  declare updatedAt?: string;
}

Song.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lyrics: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    registry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
    },
    informations: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
    },

    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "Song",
    tableName: "Songs",
    timestamps: false,
  }
);
