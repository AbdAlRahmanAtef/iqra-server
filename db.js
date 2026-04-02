const { Pool } = require("pg");
require("dotenv").config();

const uri = process.env.POSTGRES_URI;

if (!uri) {
  console.error("POSTGRES_URI environment variable is not set!");
}

const pool = new Pool({
  connectionString: uri,
  ssl: {
    rejectUnauthorized: false
  } // Ensure Supabase handles SSL correctly
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = {
  query: async (text, params) => {
    const result = await pool.query(text, params);
    if (result.rows && result.rows.length > 0) {
      result.rows = result.rows.map((row) => {
        if (row.id && !row._id) {
          row._id = row.id;
        }
        return row;
      });
    }
    return result;
  },
  pool,
};
