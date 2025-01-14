// api/profissionais.js
require('dotenv').config();
const { supabase, supabaseQuery } = require('../lib/db');

// Configurações CORS
const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,PATCH',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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
        atendimentoonline,
        atendimentoemergencia,
        atendimentopresencial,
        email,
        telefone,
        status,
        created_at,
        updated_at,
        bairro,     
        cidade,     
        estado,    
        instagram,  
        sexo,
        verificado,
        pontuacao: reviews(rating, status).avg(rating).filter(status.eq('approved')),
        referencias: reviews(status).count().filter(status.eq('approved'))      
      `);

    // Se não for uma requisição admin, mantém o filtro de approved
    if (!req.query.isAdmin) {
      query = query.eq('status', 'approved');
    }

    // Adiciona outros filtros dinâmicos baseados nos query params
    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        // Ignora o parâmetro isAdmin no filtro
        if (value && key !== 'isAdmin') {
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

    // Formata os resultados para garantir que pontuacao e referencias estejam corretos
    const formattedData = data.map(prof => ({
      ...prof,
      pontuacao: Number(prof.pontuacao?.[0]?.avg || 0).toFixed(1),
      referencias: prof.referencias?.[0]?.count || 0
    }));

    console.log(`Retornados ${data?.length || 0} profissionais`);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro no handleGet:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const handlePatch = async (req, res) => {
  const { id, status, verificado } = req.body;

  if (!id) {
    return res.status(400).json({
      error: 'Missing id',
      message: 'ID do profissional é obrigatório'
    });
  }

  try {
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (verificado !== undefined) updateData.verificado = verificado;

    const { data, error } = await supabase
      .from('profissionais')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro no update Supabase:', error);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro no handlePatch:', error);
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
    status, lgpdConsent, user_id,
    bairro, cidade, estado, instagram, sexo,
    verificado  // novos campos no destructuring
  } = req.body;

  try {

    const { data, error } = await supabase
      .from('profissionais')
      .update({
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
        bairro,     // novo campo
        cidade,     // novo campo
        estado,     // novo campo
        instagram,  // novo campo
        sexo,
        verificado,       // novo campo
        updated_at: new Date()
      })
      .eq('user_id', user_id)
      .select()
      .single();


    if (error) {
      console.error('Erro no update Supabase:', error);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }

    return res.status(200).json(data);
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
      case 'PATCH':
        return await handlePatch(req, res);
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