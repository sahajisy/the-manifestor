async function testGroqHarsh() {
  const prompt = `You are "The Manifestor", an AI accountability coach.
The user's ultimate goal is: "learn guitar".

Generate ONE short, probing reality-check question to ask the user right now about their progress towards this goal today. 
The tone must be serious, slightly confrontational, and deeply reflective. No pleasantries. No intro. Just the question.
Return only the question text. Do not include quotes around it.`;

  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
testGroqHarsh();
