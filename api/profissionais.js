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

const handleGetSingle = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: 'Missing id',
      message: 'ID do profissional é obrigatório'
    });
  }

  try {
    // Buscar o profissional específico
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (profError) {
      console.error('Erro ao buscar profissional:', profError);
      return res.status(404).json({
        error: 'Not found',
        message: 'Profissional não encontrado'
      });
    }

    // Buscar reviews deste profissional
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('prof_id', id)
      .eq('status', 'approved');

    if (reviewsError) {
      console.error('Erro ao buscar reviews:', reviewsError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Erro ao buscar avaliações'
      });
    }

    // Calcular média das avaliações
    const ratings = reviewsData.map(review => review.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // Retornar profissional com dados agregados
    const formattedProfissional = {
      ...profissional,
      pontuacao: Number(avgRating).toFixed(1),
      referencias: ratings.length,
      reviews: reviewsData
    };

    return res.status(200).json(formattedProfissional);
  } catch (error) {
    console.error('Erro no handleGetSingle:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
};

// Handlers específicos para cada método
const handleGet = async (req, res) => {
  try {
    // Primeiro, vamos buscar os profissionais
    let query = supabase
      .from('profissionais')
      .select('*');

    // Se não for uma requisição admin, mantém o filtro de approved
    if (!req.query.isAdmin) {
      query = query.eq('status', 'approved');
    }

    // Adiciona outros filtros dinâmicos baseados nos query params
    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (value && key !== 'isAdmin') {
          query = query.eq(key, value);
        }
      });
    }

    const { data: profissionais, error } = await query;

    if (error) {
      console.error('Erro na query Supabase:', error);
      return res.status(500).json([]);
    }

    // Agora vamos buscar todos os reviews aprovados
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('prof_id, rating')
      .eq('status', 'approved');

    if (reviewsError) {
      console.error('Erro ao buscar reviews:', reviewsError);
      return res.status(500).json([]);
    }

    // Agrupa os reviews por profissional
    const reviewsByProf = (reviewsData || []).reduce((acc, review) => {
      if (!acc[review.prof_id]) {
        acc[review.prof_id] = {
          ratings: [],
          count: 0
        };
      }
      acc[review.prof_id].ratings.push(review.rating);
      acc[review.prof_id].count++;
      return acc;
    }, {});

    // Formata os dados dos profissionais com as médias calculadas
    const formattedData = (profissionais || []).map(prof => {
      const profReviews = reviewsByProf[prof.id] || { ratings: [], count: 0 };
      const avgRating = profReviews.ratings.length > 0
        ? profReviews.ratings.reduce((a, b) => a + b, 0) / profReviews.ratings.length
        : 0;

      return {
        ...prof,
        pontuacao: Number(avgRating).toFixed(1),
        referencias: profReviews.count
      };
    });

    // Sempre retorna um array, mesmo que vazio
    return res.status(200).json(formattedData || []);
  } catch (error) {
    console.error('Erro no handleGet:', error);
    // Em caso de erro, retorna array vazio
    return res.status(500).json([]);
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
        // Se tiver um ID específico na query, usa o handleGetSingle
        if (req.query.id) {
          return await handleGetSingle(req, res);
        }
        // Caso contrário, usa o handleGet normal
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