import { GoogleGenerativeAI } from '@google/generative-ai';

// サーバーサイドでのみ使用
const getGeminiModel = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

export const geminiModel = getGeminiModel();

export default geminiModel;