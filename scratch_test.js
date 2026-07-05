const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash which is listed as supported
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  try {
    console.log("Calling gemini-2.5-flash...");
    const result = await model.generateContent('Say hello in one word');
    console.log('Success! Response:', result.response.text().trim());
  } catch (err) {
    console.error('Error generating content:', err.message);
  }
}
run();
