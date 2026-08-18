import fs from 'fs';
import path from 'path';

// read .env.local manually
const envPath = path.resolve('.env.local');
const envStr = fs.readFileSync(envPath, 'utf8');
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
});

async function testGroq() {
  const primaryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  console.log(primaryRes.status);
  console.log(await primaryRes.text());
}
testGroq();
