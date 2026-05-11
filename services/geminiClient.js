import { GoogleGenerativeAI } from '@google/generative-ai';

const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
}

function normalizeInput(input) {
  if (typeof input === 'string') return { prompt: input, responseFormat: 'text' };
  return {
    prompt: input.prompt ?? JSON.stringify(input),
    responseFormat: input.responseFormat || 'text',
  };
}

async function runGemini(input) {
  const model = getModel();
  const { prompt } = normalizeInput(input);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateResponse(input) {
  const text = await runGemini(input);
  const { responseFormat } = normalizeInput(input);
  return responseFormat === 'json' ? JSON.parse(text) : text;
}
