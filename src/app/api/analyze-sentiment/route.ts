import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { aim, transcript } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ score: 50 }); // Neutral score if no transcript
    }

    const prompt = `You are a sentiment analyzer for an accountability app.
The user's ultimate goal is: "${aim}".
Here is their transcript for today's reality check:
"${transcript}"

Analyze this transcript and score their current momentum and mindset on a scale of 0 to 100.
0 = Pure excuses, victim mentality, complaining, laziness, or giving up.
50 = Neutral, going through the motions, neither excelling nor failing.
100 = Taking absolute ownership, massive action, extreme accountability, and crushing the goal.

Return ONLY a valid JSON object with a single key "score" containing the integer. No other text. Example: {"score": 85}`;

    let score = 50;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const response = await model.generateContent(prompt);
      const text = response.response.text() || "{}";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.score === 'number') {
        score = parsed.score;
      }
    } catch (err) {
      console.warn("Primary API failed.", err);
      // Fallback
      try {
        const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 50
          })
        });

        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const text = data.choices[0].message.content.trim();
          const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (typeof parsed.score === 'number') {
            score = parsed.score;
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback API failed too", fallbackErr);
      }
    }

    return NextResponse.json({ score });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
