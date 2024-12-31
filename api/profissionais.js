// api/profissionais.js
const db = require('../lib/db');

// Handler compartilhado que funciona tanto no Express quanto na Vercel
async function handleProfissionais(req, res) {
  // CORS para desenvolvimento local
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Pré-flight para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Exportar o handler para uso no Express
module.exports = { handleProfissionais };

// Exportar a função padrão para a Vercel
module.exports.default = handleProfissionais;