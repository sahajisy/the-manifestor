async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: 'Say hello' }]
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
testGroq();
