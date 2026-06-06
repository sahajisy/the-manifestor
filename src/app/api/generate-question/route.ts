import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { aim, intensity = 'Harsh' } = await req.json();
    
    if (!aim) {
      return NextResponse.json({ error: 'Aim is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const question = response.text || "Are you actually working towards your aim, or just pretending?";

    return NextResponse.json({ question });
  } catch (error) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
