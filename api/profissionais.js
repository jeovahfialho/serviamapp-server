// api/profissionais.js
require('dotenv').config();
const db = require('../lib/db');

module.exports = async (req, res) => {
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
      
      // Modificar query base para incluir apenas status approved
      let queryText = "SELECT * FROM profissionais WHERE TRIM('\"' FROM status) = 'approved'";
      let queryParams = [];

      // Adicionar filtros adicionais se existirem
      if (req.query && Object.keys(req.query).length > 0) {
        Object.entries(req.query).forEach(([key, value], index) => {
          if (value) {
            queryText += ` AND ${key} = $${index + 1}`;
            queryParams.push(value);
          }
        });
      }
        
      const { rows } = await db.query(queryText, queryParams);
      console.log(`Retornados ${rows.length} profissionais aprovados`);
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const {
        tipo, nome, foto, registro, telefone, especializacao,
        graduacao, pos_graduacao, cursos, atuacao,
        valor, planos, atendimentoonline,
        atendimentoemergencia, atendimentopresencial, status
      } = req.body;
    
      try {
        const result = await db.query(
          `INSERT INTO profissionais (
            tipo, nome, foto, registro, telefone, especializacao,
            graduacao, pos_graduacao, cursos, atuacao,
            valor, planos, atendimentoonline,
            atendimentoemergencia, atendimentopresencial, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
          RETURNING *`,
          [
            tipo, nome, foto, registro, telefone, especializacao,
            graduacao, pos_graduacao, cursos, atuacao,
            valor, planos, atendimentoonline,
            atendimentoemergencia, atendimentopresencial, status
          ]
        );
        
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao inserir profissional:', error);
        return res.status(500).json({ 
          error: 'Erro ao cadastrar profissional',
          message: error.message 
        });
      }
    }z

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};