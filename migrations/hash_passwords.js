const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

const hashPasswords = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const [admins] = await connection.execute("SELECT * FROM admins");

    for (const admin of admins) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (!admin.password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await connection.execute(
          "UPDATE admins SET password = ? WHERE id = ?",
          [hashedPassword, admin.id]
        );
        console.log(`Hashed password for user: ${admin.email}`);
      }
    }

    console.log("Password hashing completed.");
    await connection.end();
  } catch (error) {
    console.error("Error hashing passwords:", error);
    process.exit(1);
  }
};

hashPasswords();
