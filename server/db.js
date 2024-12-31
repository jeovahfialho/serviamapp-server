require('dotenv').config();
const { Pool } = require('pg');

// Aqui lemos as variáveis do arquivo .env
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

module.exports = pool;
