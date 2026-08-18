async function testGeminiFetch() {
  const prompt = "You are an AI. Say Hello.";
  const key = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
testGeminiFetch();
