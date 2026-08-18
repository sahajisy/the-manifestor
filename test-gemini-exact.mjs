import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  const prompt = `You are "The Manifestor", an AI accountability coach.
The user's ultimate goal is: "learn guitar".

Generate ONE short, probing reality-check question to ask the user right now about their progress towards this goal today. 
The tone must be serious, slightly confrontational, and deeply reflective. No pleasantries. No intro. Just the question.
Return only the question text. Do not include quotes around it.`;

  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const response = await model.generateContent(prompt);
    console.log("Success! Text:", response.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}
testGemini();
