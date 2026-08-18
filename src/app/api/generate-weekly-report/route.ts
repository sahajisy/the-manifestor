import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { aim, checks, email } = await req.json();

    const prompt = `You are "The Manifestor", a brutally honest AI accountability coach.
The user's ultimate goal is: "${aim}".
Over the last 7 days, the user recorded ${checks.length} reality checks.
Here is the raw data of the questions asked during those checks:
${checks.map((c: any, i: number) => `${i+1}. ${c.question}`).join('\n')}

Generate a concise, impactful "Weekly Report" summarizing their week. 
The report should:
1. Recap their focus based on their checks.
2. Provide harsh but fair accountability.
3. End with a challenge for next week.
Format it in simple markdown. Keep it under 200 words.`;

    let summary = "";

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
          max_tokens: 1000
        })
      });

      if (!primaryRes.ok) {
        const errText = await primaryRes.text();
        throw new Error(`Primary API (Groq) failed: ${primaryRes.status} - ${errText}`);
      }

      const data = await primaryRes.json();
      summary = data.choices?.[0]?.message?.content?.trim() || "";
      if (!summary) throw new Error("Groq returned empty content (possibly ran out of tokens while reasoning)");
    } catch (err) {
      console.warn("Primary API (Groq) failed. Falling back to Gemini...", err);
      try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = ai.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const response = await model.generateContent(prompt);
        summary = response.response.text() || "";
        if (!summary) throw new Error("Gemini returned empty content");
      } catch (fallbackErr) {
        console.error("Both primary and fallback APIs failed", fallbackErr);
        summary = "Error generating report. Stay focused.";
      }
    }

    if (summary && email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        await resend.emails.send({
          from: 'The Manifestor <onboarding@resend.dev>',
          to: email,
          subject: 'Your Weekly Reality Check',
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <h2 style="color: #A855F7;">The Manifestor</h2>
            <p><strong>Your Ultimate Aim:</strong> ${aim}</p>
            <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-size: 15px; line-height: 1.6;">
              ${summary}
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">Automated by your Lazy Sunday system.</p>
          </div>`
        });
      } catch (emailErr) {
        console.error("Failed to send email:", emailErr);
      }
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Debug report route error:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
