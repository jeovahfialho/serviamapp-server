require('dotenv').config();
const OpenAI = require('openai');

const testOpenAI = async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      store: true,
      messages: [
        { role: "developer", content: "You are a helpful assistant." },
        { role: "user", content: "Write a simple test message" }
      ]
    });

    console.log('Response:', completion.choices[0].message);
  } catch (error) {
    console.error('Error:', error);
  }
};

testOpenAI();