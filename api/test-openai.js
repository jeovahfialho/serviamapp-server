const OpenAI = require('openai');

const testOpenAI = async () => {
  const openai = new OpenAI({
    apiKey: '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'
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