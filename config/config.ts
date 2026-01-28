const dotenv = require("dotenv").config({ path: "./../.env" });
const env = process.env.NODE_ENV || "development";
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: 5432,
  },
  production: {

  },
};
