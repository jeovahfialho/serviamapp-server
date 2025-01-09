// api/profissionais.js
require('dotenv').config();
const db = require('../lib/db');

// Configurações CORS
const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
};

// Funções auxiliares
const setCorsHeaders = (res) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

// Handlers específicos para cada método
const handleGet = async (req, res) => {
  try {
    // Query base com status approved
    const baseQuery = `
      SELECT * FROM profissionais 
      WHERE TRIM('"' FROM status) = 'approved'
    `;
    
    // Construção dinâmica de filtros
    const filters = [];
    const values = [];
    let paramCount = 1;

    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (value) {
          filters.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
    }

    // Montagem da query final
    const queryText = filters.length > 0
      ? `${baseQuery} AND ${filters.join(' AND ')}`
      : baseQuery;

    const { rows } = await db.query(queryText, values);
    console.log(`Retornados ${rows.length} profissionais aprovados`);
    return res.status(200).json(rows);
  } catch (error) {
    throw error;
  }
};

const handlePost = async (req, res) => {
  const {
    tipo, nome, cpf, email, foto, registro, telefone, 
    especializacao, graduacao, pos_graduacao, cursos, 
    atuacao, valor, planos, atendimentoonline,
    atendimentoemergencia, atendimentopresencial, 
    status, lgpdConsent
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO profissionais (
        tipo, nome, cpf, email, foto, registro, telefone,
        especializacao, graduacao, pos_graduacao, cursos,
        atuacao, valor, planos, atendimentoonline,  
        atendimentoemergencia, atendimentopresencial,
        status, lgpd_consent, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        tipo, nome, cpf, email, foto, registro, telefone,
        especializacao, graduacao, pos_graduacao, cursos,
        atuacao, valor, planos, atendimentoonline,
        atendimentoemergencia, atendimentopresencial,
        status, lgpdConsent
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    // Tratamento específico de erros
    if (error.code === '23505') { // Violação de chave única
      return res.status(409).json({
        error: 'Conflito',
        message: 'CPF ou e-mail já cadastrado'
      });
    }
    throw error;
  }
};

// Handler principal
module.exports = async (req, res) => {
  // Configurar CORS
  setCorsHeaders(res);

  // Responder a requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Ocorreu um erro interno';
      
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
};