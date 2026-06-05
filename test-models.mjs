import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel() {
  const models = ['gemini-2.0-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: 'hi' });
      console.log(m, 'SUCCESS');
    } catch(e) {
      console.log(m, 'ERROR:', e.message);
    }
  }
}
testModel();
