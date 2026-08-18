import { GoogleGenerativeAI } from '@google/generative-ai';

async function testModels() {
  const prompt = "You are an AI. Say Hello.";

  console.log("Testing Groq...");
  try {
    const primaryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!primaryRes.ok) {
      const errorText = await primaryRes.text();
      throw new Error(`Primary API (Groq) failed: ${primaryRes.status} - ${errorText}`);
    }

    const data = await primaryRes.json();
    console.log("Groq success:", data.choices[0].message.content.trim());
  } catch (primaryError) {
    console.warn("Primary API (Groq) failed. Falling back to Gemini...", primaryError.message);

    try {
      console.log("Testing Gemini...");
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const response = await model.generateContent(prompt);
      console.log("Gemini success:", response.response.text());
    } catch (fallbackError) {
      console.error("Both primary and fallback APIs failed!", fallbackError.message);
    }
  }
}
testModels();
