import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// read .env.local manually
const envPath = path.resolve('.env.local');
const envStr = fs.readFileSync(envPath, 'utf8');
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
});

async function testAll() {
  console.log("Testing Groq...");
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
  });
  const data = await res.json();
  const groqModels = data.data.map(m => m.id);
  console.log("Valid Groq models:", groqModels.slice(0, 5)); // show first 5
  
  console.log("\nTesting Gemini...");
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];
  for (const m of models) {
    try {
      const model = ai.getGenerativeModel({ model: m });
      const response = await model.generateContent("hello");
      console.log(m, 'SUCCESS', response.response.text().slice(0,20));
    } catch (e) {
      console.log(m, 'ERROR:', e.message);
    }
  }
}

testAll();
