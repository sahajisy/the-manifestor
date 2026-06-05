import fetch from 'node-fetch';

async function testEndpoint() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aim: 'testing', intensity: 'medium' })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (e) {
    console.error(e);
  }
}
testEndpoint();
