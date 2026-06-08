import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const usersRef = collection(db, 'users');
    const qUsers = query(usersRef, where('weeklyReport', '==', true));
    const usersSnap = await getDocs(qUsers);

    if (usersSnap.empty) {
      return NextResponse.json({ message: 'No users opted in for weekly reports' });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tsOneWeekAgo = Timestamp.fromDate(oneWeekAgo);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let reportsGenerated = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      const checksRef = collection(db, 'users', userId, 'checks');
      const qChecks = query(checksRef, where('timestamp', '>=', tsOneWeekAgo));
      const checksSnap = await getDocs(qChecks);

      if (checksSnap.empty) continue;

      const checks = checksSnap.docs.map(doc => doc.data());
      
      const prompt = `You are "The Manifestor", a brutally honest AI accountability coach.
The user's ultimate goal is: "${userData.aim || 'Unknown'}".
Over the last 7 days, the user recorded ${checks.length} reality checks.
Here is the raw data of the questions asked during those checks:
${checks.map((c, i) => `${i+1}. ${c.question}`).join('\n')}

Generate a concise, impactful "Weekly Report" summarizing their week. 
The report should:
1. Recap their aim and whether their recorded checks indicate focus.
2. Provide harsh but fair accountability.
3. End with a challenge for next week.
Format it in simple markdown. Keep it under 200 words.`;

      let summary = "";
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });
        summary = response.text || "";
      } catch (err) {
        console.warn("Primary API (Gemini) failed. Falling back to Groq...", err);
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
              temperature: 0.7,
              max_tokens: 300
            })
          });

          if (!fallbackRes.ok) {
            throw new Error(`Fallback API failed: ${fallbackRes.status}`);
          }

          const data = await fallbackRes.json();
          summary = data.choices[0].message.content.trim();
        } catch (fallbackErr) {
          console.error("Both primary and fallback APIs failed for user", userId, fallbackErr);
          summary = "Error generating report. Stay focused.";
        }
      }

      if (summary) {
        await addDoc(collection(db, 'users', userId, 'reports'), {
          summary,
          timestamp: serverTimestamp(),
          checksCount: checks.length,
          periodEnd: serverTimestamp()
        });
        reportsGenerated++;
      }
    }

    return NextResponse.json({ message: 'Success', reportsGenerated });
  } catch (error) {
    console.error("Weekly report cron error:", error);
    return NextResponse.json({ error: 'Failed to process weekly reports' }, { status: 500 });
  }
}
