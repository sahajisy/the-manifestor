import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Key length:", apiKey?.length);
  console.log("Starts with space?", apiKey?.startsWith(' '));
  
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: "Say 'Hello World'",
    });
    console.log("Response text:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
