import { NextRequest, NextResponse } from 'next/server';
import { AITrainingService, type ChatRequest } from 'lib/aiTrainingService';

const aiService = new AITrainingService();

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'メッセージが入力されていません。' },
        { status: 400 }
      );
    }

    const response = await aiService.chatWithAI(body);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'AIとの会話中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}