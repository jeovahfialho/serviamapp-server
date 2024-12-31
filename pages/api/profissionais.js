// pages/api/profissionais.js
require('dotenv').config();
const db = require('../../lib/db');

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      console.log('GET /api/profissionais chamado');
      const { rows } = await db.query('SELECT * FROM profissionais');
      console.log(`Retornados ${rows.length} profissionais`);
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const { nome, tipo, especializacao } = req.body;
      const result = await db.query(
        'INSERT INTO profissionais (nome, tipo, especializacao) VALUES ($1, $2, $3) RETURNING *',
        [nome, tipo, especializacao]
      );
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}