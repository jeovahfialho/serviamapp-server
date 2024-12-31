// server.js
require('dotenv').config(); // Adicione esta linha no início!
const express = require('express');
const cors = require('cors');
const { handleProfissionais } = require('./api/profissionais');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Adaptador para converter requisição/resposta do Express para o formato da Vercel
const vercelToExpress = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Usar o mesmo handler tanto localmente quanto na Vercel
app.all('/api/profissionais', vercelToExpress(handleProfissionais));

// Iniciar servidor local
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    // Log para debug das variáveis de ambiente
    console.log('Variáveis de ambiente carregadas:', {
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT
    });
  });
}

module.exports = app;