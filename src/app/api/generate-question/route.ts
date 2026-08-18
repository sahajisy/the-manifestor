import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { aim, intensity = 'Harsh' } = await req.json();
    
    if (!aim) {
      return NextResponse.json({ error: 'Aim is required' }, { status: 400 });
    }

    let tonePrompt = '';
    switch(intensity.toLowerCase()) {
      case 'light':
        tonePrompt = 'The tone should be encouraging, gentle, and supportive. Focus on finding small wins.';
        break;
      case 'medium':
        tonePrompt = 'The tone should be balanced and direct, like a standard coach. Firm but fair.';
        break;
      case 'ultra harsh':
        tonePrompt = 'The tone must be devastatingly brutal, aggressive, and deeply confronting. No mercy. Tear down their excuses.';
        break;
      case 'harsh':
      default:
        tonePrompt = 'The tone must be serious, slightly confrontational, and deeply reflective. No pleasantries. No intro. Just the question.';
        break;
    }

    const prompt = `You are "The Manifestor", an AI accountability coach.
The user's ultimate goal is: "${aim}".

Generate ONE short, probing reality-check question to ask the user right now about their progress towards this goal today. 
${tonePrompt}
Return only the question text. Do not include quotes around it.`;

    let question = "";

    try {
      // 1. Try Primary API (Groq)
      const primaryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
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
      question = data.choices[0].message.content.trim();
    } catch (primaryError) {
      console.warn("Primary API (Groq) failed. Falling back to Gemini...", primaryError);

      try {
        // 2. Try Secondary API Fallback (Google Gemini)
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const response = await model.generateContent(prompt);
        question = response.response.text() || "";
      } catch (fallbackError) {
        console.error("Both primary and fallback APIs failed!", fallbackError);
        // 3. Ultimate Hardcoded Fallback
        question = "Are you actually working towards your aim today, or just pretending?";
      }
    }

    if (!question) {
      question = "Are you actually working towards your aim today, or just pretending?";
    }

    // Clean up quotes if the model accidentally included them
    question = question.replace(/^["']|["']$/g, '');

    return NextResponse.json({ question });
  } catch (error) {
    console.error("AI Generation route error:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

