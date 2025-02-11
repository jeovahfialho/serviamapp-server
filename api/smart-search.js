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
          content: `You are a professional matching assistant. Analyze the user query and the provided professionals list. 
          Return a JSON object with two keys:
          1. 'matchedIds': An array of professional IDs that best match the query
          2. 'matchReasons': An object where keys are professional IDs and values are concise match explanations

          Consider:
          - Specializations
          - Expertise areas
          - Descriptions
          - Direct relevance to the query

          Provide a clear, specific reason for each matched professional.`
        },
        {
          role: "user",
          content: `Query: ${prompt}\n\nProfessionals: ${JSON.stringify(professionals.map(p => ({
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
