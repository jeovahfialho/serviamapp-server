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

  try {
    // Primeiro, busca o profissional para confirmar que existe
    const { data: profissional } = await supabase
      .from('profissionais')
      .select('*')
      .eq('telefone', telefone)
      .single();

    if (!profissional) {
      return res.status(401).json({
        error: 'Auth error',
        message: 'Credenciais inválidas'
      });
    }

    // Tenta autenticar com o email temporário
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${telefone}@temp.com`,
      password
    });

    if (error) throw error;

    return res.json({
      token: data.session.access_token,
      user: {
        ...data.user,
        ...profissional
      }
    });

  } catch (error) {
    return res.status(401).json({
      error: 'Auth error',
      message: 'Credenciais inválidas'
    });
  }
};