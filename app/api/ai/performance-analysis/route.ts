import { NextRequest, NextResponse } from 'next/server';
import { AITrainingService, type PerformanceAnalysisRequest } from 'lib/aiTrainingService';

const aiService = new AITrainingService();

export async function POST(request: NextRequest) {
  try {
    const body: PerformanceAnalysisRequest = await request.json();
    
    if (!body.exerciseHistory || body.exerciseHistory.length === 0) {
      return NextResponse.json(
        { error: '分析するトレーニング履歴が必要です。' },
        { status: 400 }
      );
    }

    const result = await aiService.analyzePerformance(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Performance analysis error:', error);
    return NextResponse.json(
      { error: 'パフォーマンス分析中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}