// pages/api/smart-search.js
import { supabase } from '../../lib/db';

const corsHeaders = {
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,DELETE,PATCH',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
};

const setCorsHeaders = (res) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] Smart Search API called - Method: ${req.method}`);
  
  setCorsHeaders(res);

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

    console.log('Calling DeepSeek API...');
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
            content: `You are a professional matching assistant for a healthcare platform. 
                     Analyze the user query and the provided professionals list.
                     Return only an array of professional IDs that best match the query.
                     Consider specializations, expertise areas, and descriptions.
                     Format response as valid JSON array of IDs.`
          },
          {
            role: 'user',
            content: `Query: ${prompt}\nProfessionals: ${JSON.stringify(professionals)}`
          }
        ],
        temperature: 0.3
      })
    });

    console.log('DeepSeek response status:', response.status);
    const aiData = await response.json();
    console.log('DeepSeek raw response:', aiData);

    const matchedIds = JSON.parse(aiData.choices[0].message.content);
    console.log('Matched professional IDs:', matchedIds);

    const results = professionals.filter(p => matchedIds.includes(p.id));
    console.log(`Returning ${results.length} matching professionals`);

    return res.status(200).json({ 
      professionals: results,
      total: results.length,
      aiResponse: process.env.NODE_ENV === 'development' ? aiData : undefined
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}