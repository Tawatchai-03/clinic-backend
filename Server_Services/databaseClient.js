// databaseClient.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

// ตรวจสอบการเชื่อมต่อ (ใช้ callback API แค่ตอนทดสอบ)
pool.getConnection((err) => {
  if (err) {
    console.error('Database connection error:', err.code);
    return;
  }
  console.log('Database connected successfully with SSL');
});

// ✅ export เป็น Promise API
module.exports = pool.promise();