async function listModels() {
  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch(`https://api.groq.com/openai/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await res.json();
  if (data.data) {
    for (const m of data.data) {
      console.log(m.id);
    }
  } else {
    console.log(data);
  }
}
listModels();
