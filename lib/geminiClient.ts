import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

// サーバーサイドでのみ使用 - 遅延初期化でビルド時エラーを回避
let geminiModelInstance: GenerativeModel | null = null;

const getGeminiModel = (): GenerativeModel => {
  if (geminiModelInstance) {
    return geminiModelInstance;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  geminiModelInstance = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  return geminiModelInstance;
};

export const geminiModel = { 
  generateContent: (prompt: string) => getGeminiModel().generateContent(prompt) 
};

export default geminiModel;