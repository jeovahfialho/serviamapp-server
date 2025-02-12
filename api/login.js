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
    // Tenta login com email formatado
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${telefone}@temp.com`,
      password
    });

    if (error) throw error;

    // Busca informações adicionais do usuário
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      data.user.id
    );

    if (userError) throw userError;

    // Opcional: Buscar dados adicionais da tabela profissionais se necessário
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('status, outros_campos')  // Especifique os campos necessários
      .eq('user_id', data.user.id)
      .single();

    return res.json({
      token: data.session.access_token,
      user: {
        ...data.user,
        ...(profissional || {})  // Inclui dados do profissional se existirem
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