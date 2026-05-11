import { generateResponse } from '../services/geminiClient.js';

function parseBody(request) {
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  return request.body || {};
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, responseFormat = 'text' } = parseBody(request);
    if (!prompt) return response.status(400).json({ error: 'Missing prompt.' });

    // Backend handoff note:
    // - Control API input by editing the prompt builders in src/services/geminiApi.js.
    // - Control API output shape with responseFormat here and stricter prompt instructions.
    // - In Vercel, finish setup by adding GEMINI_API_KEY as a server environment variable.
    // - If Supabase persistence is added, save generated responses from this handler after generateResponse().
    const result = await generateResponse({ prompt, responseFormat });

    if (responseFormat === 'json') {
      return response.status(200).json(result);
    }

    return response.status(200).json({ text: result });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Gemini request failed.' });
  }
}
