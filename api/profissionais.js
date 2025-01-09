// api/profissionais.js
require('dotenv').config();
const { supabase, supabaseQuery } = require('../lib/db');

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
    let query = supabase
      .from('profissionais')
      .select(`
        id,
        tipo,
        nome,
        foto,
        especializacao,
        graduacao,
        pos_graduacao,
        cursos,
        atuacao,
        faixa_etaria,
        valor,
        planos,
        registro,
        pontuacao,
        referencias,
        atendimentoonline,
        atendimentoemergencia,
        atendimentopresencial,
        email,
        telefone,
        created_at,
        updated_at
      `)
      .eq('status', 'approved');

    // Adiciona filtros dinâmicos baseados nos query params
    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro na query Supabase:', error);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }

    console.log(`Retornados ${data?.length || 0} profissionais aprovados`);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro no handleGet:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const handlePost = async (req, res) => {
  const {
    tipo, nome, cpf, email, foto, registro, telefone,
    especializacao, graduacao, pos_graduacao, cursos,
    atuacao, faixa_etaria, valor, planos, atendimentoonline,
    atendimentoemergencia, atendimentopresencial,
    status, lgpdConsent, user_id
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('profissionais')
      .insert([{
        tipo,
        nome,
        cpf,
        email,
        foto,
        registro,
        telefone,
        especializacao,
        graduacao,
        pos_graduacao,
        cursos,
        atuacao,
        faixa_etaria,  // Nova coluna
        valor,
        planos,
        atendimentoonline,
        atendimentoemergencia,
        atendimentopresencial,
        status,
        lgpd_consent: lgpdConsent,
        user_id,        // Nova coluna
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) {
      // Tratamento específico de erros do Supabase
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Conflito',
          message: 'CPF ou e-mail já cadastrado'
        });
      }
      console.error('Erro no insert Supabase:', error);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Erro no handlePost:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

// Handler principal
module.exports = async (req, res) => {
  // Configurar CORS - Aplicado no início, antes de qualquer processamento
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
    // Mesmo em caso de erro não tratado, os headers CORS já foram definidos
    console.error('Erro não tratado na API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
}; 