import { useState } from 'react';
import type { FormAnalysisRequest, PerformanceAnalysisRequest, ChatRequest } from 'lib/aiTrainingService';

export const useAIService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeForm = async (request: FormAnalysisRequest): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/form-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'フォーム分析に失敗しました');
      }

      const data = await response.json();
      return data.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePerformance = async (request: PerformanceAnalysisRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/performance-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'パフォーマンス分析に失敗しました');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const chatWithAI = async (request: ChatRequest): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AIとの会話に失敗しました');
      }

      const data = await response.json();
      return data.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getSetAdvice = async (
    exerciseName: string,
    performedReps: number,
    targetReps: string,
    rir: number,
    weight: number
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/ai/set-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName,
          performedReps,
          targetReps,
          rir,
          weight,
        }),
      });

      if (!response.ok) {
        return null; // セットアドバイスは失敗してもサイレントに処理
      }

      const data = await response.json();
      return data.advice;
    } catch (err) {
      console.error('Set advice error:', err);
      return null;
    }
  };

  return {
    isLoading,
    error,
    analyzeForm,
    analyzePerformance,
    chatWithAI,
    getSetAdvice,
  };
};