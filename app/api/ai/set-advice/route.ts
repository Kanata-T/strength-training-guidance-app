import { NextRequest, NextResponse } from 'next/server';
import { AITrainingService } from 'lib/aiTrainingService';

const aiService = new AITrainingService();

export async function POST(request: NextRequest) {
  try {
    const { exerciseName, performedReps, targetReps, rir, weight } = await request.json();
    
    if (!exerciseName || performedReps === undefined || !targetReps || rir === undefined || weight === undefined) {
      return NextResponse.json(
        { error: '必要なデータが不足しています。' },
        { status: 400 }
      );
    }

    const advice = await aiService.generateSetAdvice(
      exerciseName,
      performedReps,
      targetReps,
      rir,
      weight
    );
    
    return NextResponse.json({ advice });
  } catch (error) {
    console.error('Set advice error:', error);
    return NextResponse.json(
      { error: 'アドバイス生成中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}