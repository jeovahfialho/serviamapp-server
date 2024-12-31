// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

console.log('PGHOST:', process.env.PGHOST);

// Rotas
app.get('/api/profissionais', async (req, res) => {
  try {
    console.log('GET /api/profissionais chamado');  // <--- log simples

    const query = 'SELECT * FROM profissionais';
    const { rows } = await pool.query(query);

    console.log('Dados retornados do banco:', rows.length, 'profissionais'); // <--- log de sucesso
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error); // <--- log de erro
    return res.status(500).json({ error: 'Erro ao buscar profissionais da saúde' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
