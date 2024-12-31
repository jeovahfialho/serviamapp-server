// lib/db.js
const { Pool } = require('pg');

// Verificar se estamos em produção (Vercel) ou desenvolvimento
const isProduction = process.env.NODE_ENV === 'production';

// Configuração usando variáveis PG* padrão
const poolConfig = {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  }
};

// Criar e exportar o pool de conexões
const pool = new Pool(poolConfig);

// Função helper para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query', { text, error });
    throw error;
  }
};

module.exports = {
  query,
  pool
};