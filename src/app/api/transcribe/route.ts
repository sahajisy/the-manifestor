import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    
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
    return NextResponse.json({ transcript: data.text });
  } catch (error) {
    console.error("Transcription route error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
