// db.js
const { Pool } = require('pg');

// Em dev local, se quiser usar dotenv:
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

module.exports = pool;
