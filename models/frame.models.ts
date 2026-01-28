import { Model, DataTypes } from 'sequelize';
import { sequelize } from "../db/connection";

class Frame extends Model {
  public id!: string;
  public title!: string;
  public eventDate!: string;
  public context!: string;
  public content!: any;
  public docUrl?: string;
}

Frame.init({
  id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  title: DataTypes.STRING,
  eventDate: DataTypes.DATEONLY,
  context: DataTypes.STRING,
  content: DataTypes.JSONB,
  docUrl: DataTypes.TEXT,
  createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
  },
  updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'Frame',
});

export default Frame;