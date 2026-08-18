async function testAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aim: 'learn guitar', intensity: 'harsh' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error(err);
  }
}
testAPI();
