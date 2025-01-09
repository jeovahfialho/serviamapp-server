// lib/db.js
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para executar queries usando o pool PostgreSQL
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

// Função para executar queries usando o cliente Supabase
const supabaseQuery = async (table, query) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(query);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro na query Supabase', { table, query, error });
    throw error;
  }
};

module.exports = {
  query,
  pool,
  supabase,
  supabaseQuery
};