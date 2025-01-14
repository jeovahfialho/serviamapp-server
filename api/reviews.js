// api/reviews.js
require('dotenv').config();
const { supabase } = require('../lib/db');

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
  const { profId } = req.query;
  const status = req.query.status || 'approved'; // Por padrão, retorna apenas aprovados

  try {
    let query = supabase
      .from('reviews')
      .select(`
        id,
        prof_id,
        name,
        rating,
        comment,
        date,
        status,
        created_at
      `)
      .eq('prof_id', profId);

    // Se não for uma requisição admin, filtra por status
    if (!req.query.isAdmin) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Erro na query Supabase:', error);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }

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
  const { profId, name, rating, comment } = req.body;

  if (!profId || !name || !rating || !comment) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Todos os campos são obrigatórios'
    });
  }

  try {
    // Inicia uma transação
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert([{
        prof_id: profId,
        name,
        rating,
        comment,
        status: 'pending',
        date: new Date().toISOString()
      }])
      .select()
      .single();

    if (reviewError) {
      console.error('Erro ao inserir review:', reviewError);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? reviewError.message : 'Erro interno'
      });
    }

    // Atualiza as estatísticas do profissional (apenas com reviews aprovados)
    const { data: stats, error: statsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('prof_id', profId)
      .eq('status', 'approved');

    if (!statsError && stats) {
      const avgRating = stats.reduce((acc, curr) => acc + curr.rating, 0) / stats.length;
      const totalReviews = stats.length;

      await supabase
        .from('profissionais')
        .update({
          pontuacao: avgRating || 0,
          referencias: totalReviews
        })
        .eq('id', profId);
    }

    return res.status(201).json(review);
  } catch (error) {
    console.error('Erro no handlePost:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

const handlePatch = async (req, res) => {
  const { reviewId } = req.query;
  const { status, moderationComment } = req.body;

  if (!reviewId || !status) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'ID da avaliação e status são obrigatórios'
    });
  }

  try {
    // Atualiza o status do review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .update({
        status,
        moderation_comment: moderationComment,
        moderation_date: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (reviewError) {
      console.error('Erro ao atualizar review:', reviewError);
      return res.status(500).json({
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? reviewError.message : 'Erro interno'
      });
    }

    // Atualiza as estatísticas do profissional
    const { data: stats, error: statsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('prof_id', review.prof_id)
      .eq('status', 'approved');

    if (!statsError && stats) {
      const avgRating = stats.reduce((acc, curr) => acc + curr.rating, 0) / stats.length;
      const totalReviews = stats.length;

      await supabase
        .from('profissionais')
        .update({
          pontuacao: avgRating || 0,
          referencias: totalReviews
        })
        .eq('id', review.prof_id);
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error('Erro no handlePatch:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
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
      case 'PATCH':
        return await handlePatch(req, res);
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