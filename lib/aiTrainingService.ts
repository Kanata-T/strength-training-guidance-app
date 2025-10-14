import { geminiModel } from './geminiClient';
import type { TrainingSessionSet, UpcomingSessionPayload } from './trainingSessions';

export interface FormAnalysisRequest {
  exerciseName: string;
  description: string;
  currentWeight?: number;
  targetReps?: string;
  painOrDiscomfort?: string;
}

export interface PerformanceAnalysisRequest {
  exerciseHistory: Array<{
    date: string;
    exerciseName: string;
    sets: Array<{
      reps: number;
      weight: number;
      rir: number;
    }>;
  }>;
  userGoal?: 'strength' | 'hypertrophy' | 'endurance';
}

export interface ChatRequest {
  message: string;
  context?: {
    currentExercise?: string;
    sessionData?: UpcomingSessionPayload;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export class AITrainingService {
  /**
   * AIフォームコーチング機能
   * フォーム分析、種目別指導、痛み・不快感の分析
   */
  async analyzeForm(request: FormAnalysisRequest): Promise<string> {
    const prompt = `
あなたは経験豊富な筋力トレーニングのコーチです。以下の情報に基づいて、フォーム改善のアドバイスを提供してください。

【種目】: ${request.exerciseName}
【状況】: ${request.description}
${request.currentWeight ? `【現在の重量】: ${request.currentWeight}kg` : ''}
${request.targetReps ? `【目標レップ数】: ${request.targetReps}` : ''}
${request.painOrDiscomfort ? `【痛みや不快感】: ${request.painOrDiscomfort}` : ''}

以下の点について、具体的で実践的なアドバイスを日本語で提供してください：

1. 正しいフォームのポイント
2. よくある間違いと修正方法
3. 安全性の観点からの注意点
4. より効果的に筋肉に効かせる方法
${request.painOrDiscomfort ? '5. 痛みや不快感への対処法' : ''}

簡潔で分かりやすく、初心者から中級者でも理解できる内容にしてください。
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in form analysis:', error);
      return 'フォーム分析中にエラーが発生しました。しばらく時間をおいて再試行してください。';
    }
  }

  /**
   * インテリジェントトレーニング調整機能
   * パフォーマンス分析、個人最適化、デロード判定
   */
  async analyzePerformance(request: PerformanceAnalysisRequest): Promise<{
    analysis: string;
    recommendations: string[];
    needsDeload: boolean;
    deloadReason?: string;
  }> {
    const prompt = `
あなたは筋力トレーニングの専門家です。以下のトレーニングデータを分析し、パフォーマンスの傾向と最適化の提案をしてください。

【トレーニング履歴】:
${request.exerciseHistory.map((session, index) => `
セッション${index + 1} (${session.date}):
- 種目: ${session.exerciseName}
- セット詳細: ${session.sets.map(set => `${set.weight}kg × ${set.reps}レップ (RIR: ${set.rir})`).join(', ')}
`).join('\n')}

${request.userGoal ? `【トレーニング目標】: ${request.userGoal === 'hypertrophy' ? '筋肥大' : request.userGoal === 'strength' ? '筋力向上' : '筋持久力向上'}` : ''}

以下について分析し、JSON形式で回答してください：

{
  "analysis": "パフォーマンスの傾向分析（停滞期、成長パターンなど）",
  "recommendations": ["具体的な改善提案1", "具体的な改善提案2", "具体的な改善提案3"],
  "needsDeload": true/false（デロードが必要かどうか）,
  "deloadReason": "デロードが必要な理由（needsDeloadがtrueの場合のみ）"
}

科学的根拠に基づいて、実践的で具体的なアドバイスを提供してください。
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSONレスポンスをパース
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // JSONが見つからない場合のフォールバック
        return {
          analysis: text,
          recommendations: ['データ分析を継続し、次回のセッションで調整を検討してください。'],
          needsDeload: false
        };
      }
    } catch (error) {
      console.error('Error in performance analysis:', error);
      return {
        analysis: 'パフォーマンス分析中にエラーが発生しました。',
        recommendations: ['しばらく時間をおいて再試行してください。'],
        needsDeload: false
      };
    }
  }

  /**
   * 質問応答チャットボット機能
   * リアルタイム相談、科学的根拠の説明、トラブルシューティング
   */
  async chatWithAI(request: ChatRequest): Promise<string> {
    const contextInfo = request.context ? `
【現在の状況】:
${request.context.currentExercise ? `- 現在の種目: ${request.context.currentExercise}` : ''}
${request.context.userLevel ? `- トレーニングレベル: ${request.context.userLevel}` : ''}
${request.context.sessionData ? `- セッション: Workout ${request.context.sessionData.session.template_code}` : ''}
` : '';

    const prompt = `
あなたは筋力トレーニングとスポーツ科学の専門家です。ユーザーからの質問に対して、科学的根拠に基づいた正確で実践的なアドバイスを日本語で提供してください。

${contextInfo}

【ユーザーの質問】: ${request.message}

以下の点を心がけて回答してください：
1. 科学的根拠がある場合は根拠を示す
2. 安全性を最優先に考慮する
3. 初心者にも理解できるよう分かりやすく説明する
4. 具体的で実践的なアドバイスを提供する
5. 医療的なアドバイスは避け、必要に応じて専門医への相談を勧める

簡潔で親しみやすい口調で回答してください。
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in AI chat:', error);
      return 'AIとの対話中にエラーが発生しました。しばらく時間をおいて再試行してください。';
    }
  }

  /**
   * セット完了時の自動アドバイス生成
   */
  async generateSetAdvice(
    exerciseName: string,
    performedReps: number,
    targetReps: string,
    rir: number,
    weight: number
  ): Promise<string> {
    const prompt = `
【種目】: ${exerciseName}
【実施レップ数】: ${performedReps}
【目標レップ数】: ${targetReps}
【RIR】: ${rir}
【重量】: ${weight}kg

上記のセット結果に基づいて、次セットまたは次回のトレーニングに向けた簡潔なアドバイスを50文字以内で提供してください。RIRの値と目標レップ数の達成度を考慮してください。
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text().substring(0, 100); // 安全のため100文字でカット
    } catch (error) {
      console.error('Error in set advice:', error);
      return '良いセットでした！次も頑張りましょう。';
    }
  }
}