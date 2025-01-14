// api/profissionais/[id].js
const { supabase } = require('../../lib/db');

const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,PATCH',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

const setCorsHeaders = (res) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

module.exports = async (req, res) => {
  // Configurar CORS
  setCorsHeaders(res);

  // Responder a requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se é método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = req.query.id; // Vercel usa query params para path params

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
    console.error('Erro não tratado na API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};