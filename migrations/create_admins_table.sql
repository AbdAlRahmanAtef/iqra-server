CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (email, password) 
SELECT 'admin@iqra.com', 'admin123' 
WHERE NOT EXISTS (SELECT * FROM admins WHERE email = 'admin@iqra.com');
