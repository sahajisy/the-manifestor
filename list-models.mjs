import fetch from 'node-fetch';

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    for (const m of data.models) {
      console.log(m.name, m.supportedGenerationMethods.includes('generateContent') ? 'generateContent' : '');
    }
  } else {
    console.log(data);
  }
}
listModels();
