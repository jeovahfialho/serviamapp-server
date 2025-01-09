// api/profissionais.js
require('dotenv').config();
const { supabase } = require('../lib/db');

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

    const { data, error } = await query;

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
        faixa_etaria,
        valor,
        planos,
        atendimentoonline,
        atendimentoemergencia,
        atendimentopresencial,
        status,
        lgpd_consent: lgpdConsent,
        user_id,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) {
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

const handleSignUp = async (req, res) => {
  const { telefone, password, tipo } = req.body;

  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${telefone}@temp.com`, // temporário, já que Supabase exige email
      password,
      phone: telefone,
      options: {
        data: { 
          telefone,
          tipo
        }
      }
    });

    if (authError) throw authError;

    // 2. Criar registro na tabela de profissionais
    const { data: profissionalData, error: dbError } = await supabase
      .from('profissionais')
      .insert([{
        telefone,
        tipo,
        user_id: authData.user.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return res.status(201).json({
      message: 'Conta criada com sucesso',
      data: profissionalData
    });

  } catch (error) {
    console.error('Erro no signup:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflito',
        message: 'Telefone já cadastrado'
      });
    }
    return res.status(400).json({
      error: 'Signup error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro ao criar conta'
    });
  }
};

// Handler principal (este é o handler principal que você perguntou)
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
        // Se for rota de signup
        if (req.url.endsWith('/signup')) {
          return await handleSignUp(req, res);
        }
        // Se for POST normal
        return await handlePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Erro não tratado na API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};