import React, { useState } from 'react';
import { useAIService } from '../lib/hooks/useAIService';
import type { FormAnalysisRequest } from '../lib/aiTrainingService';

interface AIFormCoachProps {
  exerciseName: string;
  onClose: () => void;
}

export const AIFormCoach: React.FC<AIFormCoachProps> = ({ exerciseName, onClose }) => {
  const { analyzeForm, isLoading, error } = useAIService();
  const [formData, setFormData] = useState<Omit<FormAnalysisRequest, 'exerciseName'>>({
    description: '',
    currentWeight: undefined,
    targetReps: '',
    painOrDiscomfort: '',
  });
  const [analysis, setAnalysis] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: FormAnalysisRequest = {
      exerciseName,
      ...formData,
    };

    const result = await analyzeForm(request);
    if (result) {
      setAnalysis(result);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl shadow-slate-900/30 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 mb-6 sticky top-0 bg-white pb-4 border-b border-slate-100 -mx-5 sm:-mx-6 px-5 sm:px-6 -mt-5 sm:-mt-6 pt-5 sm:pt-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">AIフォームコーチ</h3>
            <p className="text-sm text-slate-500 mt-1">
              {exerciseName} のフォーム改善アドバイスを取得
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
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4">
            <div>
              <label className="block text-base sm:text-sm font-medium text-slate-700 mb-2">
                現在の状況や困っていること *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="フォームに不安がある、重量が上がらない、など..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-base sm:text-sm font-medium text-slate-700 mb-2">
                  現在の重量 (kg)
                </label>
                <input
                  type="number"
                  value={formData.currentWeight || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentWeight: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 sm:py-2 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="例: 50"
                />
              </div>

              <div>
                <label className="block text-base sm:text-sm font-medium text-slate-700 mb-2">
                  目標レップ数
                </label>
                <input
                  type="text"
                  value={formData.targetReps}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetReps: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 sm:py-2 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="例: 8-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-base sm:text-sm font-medium text-slate-700 mb-2">
                痛みや不快感（あれば）
              </label>
              <textarea
                value={formData.painOrDiscomfort}
                onChange={(e) => setFormData(prev => ({ ...prev, painOrDiscomfort: e.target.value }))}
                placeholder="膝に違和感がある、肩が痛い、など..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.description.trim()}
              className="w-full rounded-xl bg-primary px-4 py-4 sm:py-3 text-base sm:text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
            >
              {isLoading ? 'AI分析中...' : 'フォーム分析を開始'}
            </button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-5 sm:space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 sm:p-4">
              <h4 className="font-semibold text-slate-900 mb-3 text-lg sm:text-base">AIアドバイス</h4>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-base sm:text-sm">
                {analysis}
              </div>
            </div>
            
            <div className="flex gap-3 sm:gap-2 flex-col sm:flex-row">
              <button
                onClick={() => setAnalysis('')}
                className="rounded-xl border border-slate-200 px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 min-h-touch flex-1 sm:flex-initial"
              >
                再分析
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