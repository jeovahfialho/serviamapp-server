require('dotenv').config();
const { supabase } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { telefone, password } = req.body;
  console.log('Tentativa de login:', { telefone });
  

  try {
    // Log profissional
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('*')
      .eq('telefone', telefone)
      .single();
 
    console.log('Profissional encontrado:', profissional);
    if (profError) console.log('Erro busca profissional:', profError);
 
    if (!profissional) {
      return res.status(401).json({
        error: 'Auth error',
        message: 'Profissional não encontrado'
      });
    }
 
    // Tenta login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${telefone}@temp.com`,
      password
    });
 
    console.log('Resposta auth:', { data, error });
 
    if (error) throw error;
 
    return res.json({
      token: data.session.access_token,
      user: {
        ...data.user,
        ...profissional
      }
    });
 
  } catch (error) {
    console.log('Erro completo:', error);
    return res.status(401).json({
      error: 'Auth error', 
      message: error.message || 'Credenciais inválidas'
    });
  }
};