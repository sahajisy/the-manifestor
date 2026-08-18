import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  const prompt = "You are an AI. Say Hello.";
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const response = await model.generateContent(prompt);
    console.log("Success! Text:", response.response.text());
    console.log("Full response:", JSON.stringify(response.response, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}
testGemini();
