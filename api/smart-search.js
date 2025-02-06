// api/smart-search.js
require('dotenv').config();
const { supabase } = require('../lib/db');
const OpenAI = require('openai');

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
  console.log(`[${new Date().toISOString()}] Smart Search API called - Method: ${req.method}`);
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    console.log('Search prompt:', prompt);

    const { data: professionals, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('status', 'approved');

    if (error) throw error;
    console.log(`Found ${professionals.length} professionals`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze the query and professionals list. Return only a JSON array of IDs for best matches."
        },
        {
          role: "user", 
          content: `Query: ${prompt}\nProfessionals: ${JSON.stringify(professionals)}`
        }
      ]
    });

    const matchedIds = JSON.parse(completion.choices[0].message.content);
    const results = professionals.filter(p => matchedIds.includes(p.id));
    
    return res.status(200).json({
      professionals: results,
      total: results.length,
      aiResponse: process.env.NODE_ENV === 'development' ? completion : undefined
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};