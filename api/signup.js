// api/signup.js
require('dotenv').config();
const { supabase } = require('../lib/db');

module.exports = async (req, res) => {
 // CORS headers
 res.setHeader('Access-Control-Allow-Credentials', true);
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
 res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

 // Handle OPTIONS
 if (req.method === 'OPTIONS') {
   return res.status(200).end();
 }

 // Only allow POST
 if (req.method !== 'POST') {
   return res.status(405).json({ error: 'Method not allowed' });
 }

 const { telefone, password, tipo } = req.body;

 try {
   // Create auth user
   const { data: authData, error: authError } = await supabase.auth.signUp({
     email: `${telefone}@temp.com`,
     password,
     phone: telefone,
     options: {
       data: { 
         telefone,
         tipo 
       }
     }
   });

   if (authError) throw authError;

   // Create professional record
   const { data: profissionalData, error: dbError } = await supabase
     .from('profissionais')
     .insert([{
       telefone,
       user_id: authData.user.id,
       status: 'pending'
     }])
     .select()
     .single();

   if (dbError) throw dbError;

   return res.status(201).json({
     message: 'Conta criada com sucesso',
     data: profissionalData
   });

 } catch (error) {
   console.error('Erro no signup:', error);
   
   if (error.code === '23505') {
     return res.status(409).json({
       error: 'Conflito',
       message: 'Telefone já cadastrado'
     });
   }

   return res.status(400).json({
     error: 'Signup error',
     message: process.env.NODE_ENV === 'development' ? error.message : 'Erro ao criar conta'
   });
 }
};