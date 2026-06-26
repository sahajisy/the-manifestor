import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { reason, aim } = await bodyParse(req);

    if (!reason || reason.length < 50) {
      return NextResponse.json({
        accepted: false,
        message: "Your excuse is too short. If you're going to quit on your ultimate aim, you need to articulate exactly why. Try again with at least 50 characters of truth."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no API key
      return NextResponse.json({ accepted: true, message: "API key missing, allowing quit." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are the uncompromising AI behind "The Manifestor".
The user's ultimate aim was: "${aim || 'Unknown'}".
They are trying to quit the app or delete their account.
They provided the following reason for quitting: "${reason}"

Your job is to evaluate if this is a genuinely valid, mature reason to quit, OR if it's just a weak excuse, procrastination, or fear masquerading as a reason.

If it's a weak excuse (which 90% of them are):
Return a JSON object with:
{
  "accepted": false,
  "message": "<a brutal, honest paragraph tearing apart their excuse and shaming them for giving up on their aim>"
}

If it's a genuinely valid life reason (e.g. they achieved it, a major life tragedy occurred, or a very thoughtful pivot):
Return a JSON object with:
{
  "accepted": true,
  "message": "<a brief, cold acknowledgement of their departure>"
}

Only return raw JSON. No markdown formatting. No backticks.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Strip markdown blocks if present
    const cleanJson = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const data = JSON.parse(cleanJson);

    return NextResponse.json(data);
  } catch (error) {
    console.error("No-Quit evaluation failed:", error);
    // If the API fails, we shouldn't trap them forever due to a server error.
    return NextResponse.json({ accepted: true, message: "Server error. You may pass." });
  }
}

async function bodyParse(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
