require('dotenv').config();
const { supabase } = require('../lib/db');

module.exports = async (req, res) => {
res.setHeader('Access-Control-Allow-Credentials', true);
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
 res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;

    const { data: profissional, error: dbError } = await supabase
      .from('profissionais')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (dbError) throw dbError;

    res.json(profissional);
  } catch (error) {
    res.status(401).json({ error: 'Não autorizado' });
  }
};