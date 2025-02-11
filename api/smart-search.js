require('dotenv').config();
const { supabase } = require('../lib/db');
const OpenAI = require('openai');

module.exports = async (req, res) => {
  console.log(`[${new Date().toISOString()}] Smart Search API called - Method: ${req.method}`);

  // Headers necessários para lidar com CORS e pré-verificação OPTIONS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Você pode restringir a origem se precisar
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder imediatamente às requisições OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end(); // Certifique-se de retornar 200
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  console.log('Received search prompt:', prompt);

  try {
    console.log('Fetching approved professionals from Supabase...');
    const { data: professionals, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Error fetching professionals from Supabase');
    }

    console.log('Calling OpenAI API...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
      {
      role: "system",
      content: `Você é um assistente de correspondência de profissionais. Analise a consulta do usuário e a lista de profissionais fornecida.
     
      INSTRUÇÕES IMPORTANTES:
      - SEMPRE responda em PORTUGUÊS
      - Retorne um objeto JSON com duas chaves:
        1. 'matchedIds': Uma matriz de IDs de profissionais que melhor correspondem à consulta
        2. 'matchReasons': Um objeto onde as chaves são IDs de profissionais e os valores são explicações sucintas de correspondência
     
      Considere:
      - Especializações
      - Áreas de expertise
      - Descrições
      - Relevância direta para a consulta
     
      Forneça um motivo claro e específico para cada profissional correspondente.
      
      ATENÇÃO: A resposta DEVE ser em PORTUGUÊS e em formato JSON válido.`
      },
      {
      role: "user",
      content: `Consulta: ${prompt}\n\nProfissionais: ${JSON.stringify(professionals.map(p => ({
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      especializacao: p.especializacao,
      atuacao: p.atuacao
      })))}`
      }
      ]
     });

    console.log('OpenAI response received:', completion);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completion.choices[0].message.content);
      console.log('Parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Invalid JSON from OpenAI response');
    }

    const { matchedIds, matchReasons } = parsedResponse;

    const results = professionals.filter(p => matchedIds.includes(p.id));
    
    return res.status(200).json({
      professionals: results,
      matchReasons: matchReasons || {},
      total: results.length,
      aiResponse: process.env.NODE_ENV === 'development' ? completion : undefined
    });

  } catch (error) {
    console.error('Error during search process:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
