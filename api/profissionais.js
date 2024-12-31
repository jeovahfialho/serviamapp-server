// api/profissionais.js
const pool = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      console.log('GET /api/profissionais chamado');

      const query = 'SELECT * FROM profissionais';
      const { rows } = await pool.query(query);

      console.log('Dados retornados do banco:', rows.length, 'profissionais');
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      return res.status(500).json({ error: 'Erro ao buscar profissionais da saúde' });
    }
  } else {
    // Se não for GET
    return res.status(405).json({ error: 'Method not allowed' });
  }
};
