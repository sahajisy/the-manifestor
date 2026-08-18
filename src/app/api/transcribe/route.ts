import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const aim = formData.get('aim') as string || "Goal";
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqFormData = new FormData();
    // Groq requires a filename with a recognized extension
    groqFormData.append('file', file, 'audio.webm'); 
    groqFormData.append('model', 'whisper-large-v3');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: groqFormData
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Groq Transcription Error:", errorText);
      return NextResponse.json({ error: 'Transcription failed' }, { status: res.status });
    }

    const data = await res.json();
    const transcript = data.text;
    let sentimentScore = null;

    if (transcript && transcript.trim().length > 0) {
      const prompt = `You are a sentiment analyzer for an accountability app.
The user's ultimate goal is: "${aim}".
Here is their transcript for today's reality check:
"${transcript}"

Analyze this transcript and score their current momentum and mindset on a scale of 0 to 100.
0 = Pure excuses, victim mentality, complaining, laziness, or giving up.
50 = Neutral, going through the motions, neither excelling nor failing.
100 = Taking absolute ownership, massive action, extreme accountability, and crushing the goal.

Return ONLY a valid JSON object with a single key "score" containing the integer. No other text. Example: {"score": 85}`;

      sentimentScore = 50;

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
            temperature: 0.1,
            max_tokens: 1000
          })
        });

        if (!primaryRes.ok) throw new Error("Groq failed");
        const sentimentData = await primaryRes.json();
        let text = sentimentData.choices?.[0]?.message?.content?.trim() || "";
        if (!text) throw new Error("Groq returned empty content");
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (typeof parsed.score === 'number') {
          sentimentScore = parsed.score;
        }
      } catch (err) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
          const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
          const response = await model.generateContent(prompt);
          let text = response.response.text() || "";
          if (!text) throw new Error("Gemini empty");
          const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (typeof parsed.score === 'number') {
            sentimentScore = parsed.score;
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({ transcript, sentimentScore });
  } catch (error) {
    console.error("Transcription route error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
