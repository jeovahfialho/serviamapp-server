// api/profissionais.js
require('dotenv').config();
const { supabase, supabaseQuery } = require('../lib/db');

// Configurações CORS mais permissivas para desenvolvimento
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return await fn(req, res);
};

// Handlers específicos para cada método
const handleGet = async (req, res) => {
  try {
    let query = supabase
      .from('profissionais')
      .select('*')
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

    if (error) throw error;

    console.log(`Retornados ${count} profissionais aprovados`);
    return res.status(200).json(data);
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
        pos_graduacao: pos_graduacao,
        cursos,
        atuacao,
        valor,
        planos,
        atendimentoonline,
        atendimentoemergencia,
        atendimentopresencial,
        status,
        lgpd_consent: lgpdConsent,
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
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    throw error;
  }
};

// Handler principal sem o wrapper de CORS (será adicionado depois)
const handler = async (req, res) => {
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

// Exporta o handler com o wrapper de CORS
module.exports = allowCors(handler);