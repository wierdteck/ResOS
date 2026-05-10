export async function callExternalAi(prompt) {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return null;
  }

  console.info('External AI integration is stubbed for demo mode.', prompt);
  return null;
}
