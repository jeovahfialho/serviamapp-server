// api/smart-search.js
require('dotenv').config();
const { supabase } = require('../lib/db');

const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
};

async function searchWithDeepSeek(prompt, professionals) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-53ca7c98e2d842fba56818f94be75c9d`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional matching assistant. Analyze the user query and the provided professionals list to find the best matches based on expertise, specialization, and requirements.'
          },
          {
            role: 'user',
            content: `Query: ${prompt}\n\nProfessionals: ${JSON.stringify(professionals)}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

const handlePost = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Missing prompt',
      message: 'A busca não pode estar vazia'
    });
  }

  try {
    // Buscar todos os profissionais ativos
    const { data: professionals, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('status', 'approved');

    if (error) throw error;

    // Realizar busca com DeepSeek
    const aiResponse = await searchWithDeepSeek(prompt, professionals);
    
    // Parsear resposta do AI e filtrar profissionais
    const recommendedIds = JSON.parse(aiResponse);
    const matchedProfessionals = professionals.filter(prof => 
      recommendedIds.includes(prof.id)
    );

    return res.status(200).json({
      professionals: matchedProfessionals,
      total: matchedProfessionals.length
    });
  } catch (error) {
    console.error('Smart search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

module.exports = async (req, res) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return await handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};