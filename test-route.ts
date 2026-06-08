import { POST } from './src/app/api/generate-question/route.ts';

async function run() {
  const req = {
    json: async () => ({ aim: 'Become a millionaire', intensity: 'Harsh' })
  } as Request;
  
  const res = await POST(req);
  const data = await res.json();
  console.log(res.status, data);
}
run();
