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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/30"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">AIフォームコーチ</h3>
            <p className="text-sm text-slate-500 mt-1">
              {exerciseName} のフォーム改善アドバイスを取得
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            閉じる
          </button>
        </header>

        {!analysis ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                現在の状況や困っていること *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="フォームに不安がある、重量が上がらない、など..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  現在の重量 (kg)
                </label>
                <input
                  type="number"
                  value={formData.currentWeight || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentWeight: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="例: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  目標レップ数
                </label>
                <input
                  type="text"
                  value={formData.targetReps}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetReps: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="例: 8-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                痛みや不快感（あれば）
              </label>
              <textarea
                value={formData.painOrDiscomfort}
                onChange={(e) => setFormData(prev => ({ ...prev, painOrDiscomfort: e.target.value }))}
                placeholder="膝に違和感がある、肩が痛い、など..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.description.trim()}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'AI分析中...' : 'フォーム分析を開始'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900 mb-2">AIアドバイス</h4>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setAnalysis('')}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                再分析
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                完了
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};