import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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
  };

  sequelize = new Sequelize(
    config.database!,
    config.username!,
    config.password,
    {
      host: config.host,
      port: 5432,
      dialect: "postgres",
      logging: false,
      dialectOptions:
        process.env.DB_SSL === "true"
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : {},
    }
  );
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    //console.log('La connexion à la base de données a été établie avec succès.');
  } catch (error) {
    //console.error('Impossible de se connecter à la base de données:', error);
  }
};
