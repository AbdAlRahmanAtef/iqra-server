const mysql = require("mysql2/promise");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const runMigration = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const migrationPath = path.join(
      __dirname,
      "migrations",
      "create_admins_table.sql"
    );
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // Split by semicolon to handle multiple statements
    const statements = migrationSql.split(";").filter((stmt) => stmt.trim());

    for (const statement of statements) {
      await connection.execute(statement);
      console.log("Executed:", statement.substring(0, 50) + "...");
    }

    console.log("Migration completed successfully.");
    await connection.end();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
