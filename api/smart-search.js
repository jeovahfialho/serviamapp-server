// api/smart-search.js
require('dotenv').config();
const { supabase } = require('../lib/db');
const OpenAI = require('openai');

module.exports = async (req, res) => {
  console.log(`[${new Date().toISOString()}] Smart Search API called - Method: ${req.method}`);
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  console.log('Search prompt:', prompt);

  try {
    console.log('Fetching professionals from Supabase...');
    const { data: professionals, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Found ${professionals.length} approved professionals`);
    console.log('Calling ChatGPT API...');

    const openai = new OpenAI({
      apiKey: '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'
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional matching assistant. Analyze the user query and the provided professionals list. Return only an array of professional IDs that best match the query. Consider specializations, expertise areas, and descriptions. Return only a valid JSON array of IDs."
        },
        {
          role: "user",
          content: `Query: ${prompt}\nProfessionals: ${JSON.stringify(professionals)}`
        }
      ]
    });

    console.log('ChatGPT response:', completion);
    const matchedIds = JSON.parse(completion.choices[0].message.content);
    console.log('Matched professional IDs:', matchedIds);

    const results = professionals.filter(p => matchedIds.includes(p.id));
    console.log(`Returning ${results.length} matching professionals`);

    return res.status(200).json({
      professionals: results,
      total: results.length,
      aiResponse: process.env.NODE_ENV === 'development' ? completion : undefined
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};