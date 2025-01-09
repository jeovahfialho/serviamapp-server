// api/me.js
require('dotenv').config();
const { supabase } = require('../lib/db');

module.exports = async (req, res) => {
 res.setHeader('Access-Control-Allow-Credentials', true);
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
 res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

 if (req.method === 'OPTIONS') {
   return res.status(200).end();
 }

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

   return res.status(200).json(profissional);
 } catch (error) {
   console.error('Erro:', error);
   return res.status(401).json({ error: 'Não autorizado' });
 }
};