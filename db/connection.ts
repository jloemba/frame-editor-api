//const { Sequelize } = require("sequelize");
import { Sequelize } from "sequelize";

const env = process.env.NODE_ENV || "local";
export var sequelize: Sequelize;
if (env != "local") {
  sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  const config = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: 5432,
    dialect: "postgres",
    dialectOptions:
      env != "local"
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
  };
  sequelize = new Sequelize(
    config.database!,
    config.username!,
    config.password,
    {
      host: config.host,
      port: 5432,
      dialect: "postgres",
      logging: false, // Désactive les logs SQL, optionnel
    }
  );
}
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('La connexion à la base de données a été établie avec succès.');
  } catch (error) {
    console.error('Impossible de se connecter à la base de données:', error);
  }
};

module.exports = { sequelize, connectDB };
