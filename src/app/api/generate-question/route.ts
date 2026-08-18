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
          model: 'openai/gpt-oss-20b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!primaryRes.ok) {
        const errorText = await primaryRes.text();
        throw new Error(`Primary API (Groq) failed: ${primaryRes.status} - ${errorText}`);
      }

      const data = await primaryRes.json();
      question = data.choices?.[0]?.message?.content?.trim() || "";
      if (!question) throw new Error("Groq returned empty content (possibly ran out of tokens while reasoning)");
    } catch (primaryError) {
      console.warn("Primary API (Groq) failed. Falling back to Gemini...", primaryError);
      (globalThis as any).groqErr = primaryError.toString();

      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!geminiRes.ok) {
           const errText = await geminiRes.text();
           throw new Error(`Gemini API failed: ${geminiRes.status} - ${errText}`);
        }
        
        const geminiData = await geminiRes.json();
        question = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (!question) throw new Error("Gemini returned empty content");
      } catch (fallbackError: any) {
        console.error("Both primary and fallback APIs failed!", fallbackError);
        question = `Are you actually working towards your aim today, or just pretending? GROQ: ${primaryError.message} GEMINI: ${fallbackError.message}`;
      }
    }

    if (!question) {
      question = `Are you actually working towards your aim today, or just pretending? NO QUESTION GENERATED`;
    }

    // Clean up quotes if the model accidentally included them
    question = question.replace(/^["']|["']$/g, '');

    return NextResponse.json({ question });
  } catch (error) {
    console.error("AI Generation route error:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

