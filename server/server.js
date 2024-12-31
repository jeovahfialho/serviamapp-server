require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Exemplo de rota para buscar profissionais
app.get('/api/profissionais', async (req, res) => {
  try {
    const query = 'SELECT * FROM profissionais_saude'; // Ajuste para a sua tabela real
    const { rows } = await pool.query(query);

    // rows agora contém os dados que estão no banco
    // Você pode processar se quiser, por exemplo:
    // mapear nomes, converter dados, etc.
    // Mas se estiver ok, retorne como está:
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    res.status(500).json({ error: 'Erro ao buscar profissionais da saúde' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
