// api/smart-search.js
require('dotenv').config();
const { supabase } = require('../lib/db');
const OpenAI = require('openai');

module.exports = async (req, res) => {
    
 console.log(`[${new Date().toISOString()}] Smart Search API called - Method: ${req.method}`);
 
};