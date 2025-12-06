const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // Serverless-friendly settings
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Export the config and a helper to create connections
module.exports = {
  execute: async (query, params) => {
    const connection = await mysql.createConnection(dbConfig);
    try {
      const result = await connection.execute(query, params);
      return result;
    } finally {
      await connection.end();
    }
  },
};
