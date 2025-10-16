import React, { useState } from 'react';
import { useAIService } from '../lib/hooks/useAIService';
import type { TrainingSessionSet } from '../lib/trainingSessions';

interface AIPerformanceAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionHistory: Array<{
    date: string;
    sets: TrainingSessionSet[];
  }>;
}

export const AIPerformanceAnalyzer: React.FC<AIPerformanceAnalyzerProps> = ({
  isOpen,
  onClose,
  sessionHistory,
}) => {
  const { analyzePerformance, isLoading, error } = useAIService();
  const [analysis, setAnalysis] = useState<{
    analysis: string;
    recommendations: string[];
    needsDeload: boolean;
    deloadReason?: string;
  } | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  // セッション履歴から種目を抽出
  const exercises = Array.from(
    new Set(
      sessionHistory.flatMap(session =>
        session.sets.map(set => set.exercise_name)
      )
    )
  );

  const handleAnalyze = async () => {
    if (!selectedExercise) return;

    // 選択した種目のデータのみを抽出
    const exerciseHistory = sessionHistory
      .map(session => ({
        date: session.date,
        exerciseName: selectedExercise,
        sets: session.sets
          .filter(set => set.exercise_name === selectedExercise && set.performed_reps && set.weight)
          .map(set => ({
            reps: set.performed_reps!,
            weight: set.weight!,
            rir: set.performed_rir || 3,
          })),
      }))
      .filter(session => session.sets.length > 0);

    if (exerciseHistory.length === 0) {
      return;
    }

    const result = await analyzePerformance({
      exerciseHistory,
      userGoal: 'hypertrophy', // デフォルトで筋肥大を設定
    });

    if (result) {
      setAnalysis(result);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl shadow-slate-900/30 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 mb-6 sticky top-0 bg-white pb-4 border-b border-slate-100 -mx-5 sm:-mx-6 px-5 sm:px-6 -mt-5 sm:-mt-6 pt-5 sm:pt-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">AIパフォーマンス分析</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              トレーニング履歴を分析してパフォーマンス向上のアドバイスを取得
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 sm:px-3 sm:py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 min-h-touch min-w-touch flex items-center justify-center shrink-0"
            aria-label="閉じる"
          >
            <span className="hidden sm:inline">閉じる</span>
            <svg className="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {!analysis ? (
          <div className="space-y-5 sm:space-y-4">
            <div>
              <label className="block text-base sm:text-sm font-medium text-slate-700 mb-2">
                分析する種目を選択
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 sm:py-2 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">種目を選択...</option>
                {exercises.map(exercise => (
                  <option key={exercise} value={exercise}>
                    {exercise}
                  </option>
                ))}
              </select>
            </div>

            {selectedExercise && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-4">
                <h4 className="font-medium text-slate-900 mb-2 text-base sm:text-sm">分析対象データ</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedExercise} の履歴: {' '}
                  {sessionHistory
                    .map(session => session.sets.filter(set => set.exercise_name === selectedExercise && set.performed_reps))
                    .reduce((total, sets) => total + sets.length, 0)} セット
                </p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedExercise || isLoading}
              className="w-full rounded-xl bg-primary px-4 py-4 sm:py-3 text-base sm:text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
            >
              {isLoading ? 'AI分析中...' : 'パフォーマンス分析を開始'}
            </button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* 分析結果 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 sm:p-4">
              <h4 className="font-semibold text-slate-900 mb-3 text-lg sm:text-base">パフォーマンス分析</h4>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-base sm:text-sm">
                {analysis.analysis}
              </div>
            </div>

            {/* 推奨事項 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 sm:p-4">
              <h4 className="font-semibold text-slate-900 mb-3 text-lg sm:text-base">改善提案</h4>
              <ul className="space-y-3 sm:space-y-2">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 sm:gap-2 text-base sm:text-sm text-slate-700 leading-relaxed">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* デロード判定 */}
            {analysis.needsDeload && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 sm:p-4">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2 text-lg sm:text-base">
                  <svg className="h-6 w-6 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  デロード推奨
                </h4>
                <p className="text-sm text-orange-800 leading-relaxed">{analysis.deloadReason}</p>
              </div>
            )}

            <div className="flex gap-3 sm:gap-2 flex-col sm:flex-row">
              <button
                onClick={() => {
                  setAnalysis(null);
                  setSelectedExercise('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 min-h-touch flex-1 sm:flex-initial"
              >
                別の種目を分析
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-primary px-4 py-3 sm:py-2 text-base sm:text-sm font-semibold text-white transition hover:bg-primary-dark min-h-touch flex-1 sm:flex-initial"
              >
                完了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};