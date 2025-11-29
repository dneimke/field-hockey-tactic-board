export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp';

export const SUPPORTED_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
] as const;

export type GeminiModel = typeof SUPPORTED_MODELS[number];

export const getGeminiConfig = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  return {
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL as GeminiModel,
  };
};


