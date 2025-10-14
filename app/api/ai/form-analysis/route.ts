import { NextRequest, NextResponse } from 'next/server';
import { AITrainingService, type FormAnalysisRequest } from 'lib/aiTrainingService';

const aiService = new AITrainingService();

export async function POST(request: NextRequest) {
  try {
    const body: FormAnalysisRequest = await request.json();
    
    if (!body.exerciseName || !body.description) {
      return NextResponse.json(
        { error: '種目名と状況の説明は必須です。' },
        { status: 400 }
      );
    }

    const analysis = await aiService.analyzeForm(body);
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Form analysis error:', error);
    return NextResponse.json(
      { error: 'フォーム分析中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}