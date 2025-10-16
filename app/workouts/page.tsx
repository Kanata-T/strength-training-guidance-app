"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { BASE_PLAN } from 'lib/trainingPlan';

const NAV_LINKS: Array<{ href: string; label: string; active?: boolean }> = [
  { href: '/', label: 'ホーム' },
  { href: '/training', label: '記録ページ' },
  { href: '/workouts', label: 'ワークアウト一覧', active: true },
  { href: '/workouts/history', label: '過去の記録' }
];

export default function WorkoutListPage() {
  const sessions = useMemo(() => BASE_PLAN, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-cyan-100/20 bg-gradient-to-r from-white/95 to-cyan-50/80 shadow-sm shadow-cyan-900/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <Link href="/" className="text-base font-semibold text-slate-900 transition hover:text-cyan-600 sm:text-lg whitespace-nowrap min-w-touch">
            Strength Guide
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1.5 text-sm sm:gap-2 sm:text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-1.5 font-medium transition min-h-touch flex items-center justify-center text-xs sm:text-sm sm:px-3 sm:py-1 ${
                  link.active
                    ? 'border border-cyan-600/40 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-700 hover:from-cyan-500/20 hover:to-teal-500/20'
                    : 'border border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-900'
                }`}
              >
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.label.replace('ページ', '').replace('一覧', '').replace('の記録', '')}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8 px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 sm:p-6 lg:p-8 shadow-lg shadow-cyan-900/10">
          <header className="space-y-2">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-cyan-600">Workout Catalog</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">ワークアウト一覧</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              ベースプランに含まれるワークアウトを一覧で確認できます。トレーニングの狙いや種目構成を事前にチェックしましょう。
            </p>
          </header>
        </section>

        <section className="grid gap-5 sm:gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {sessions.map((session) => (
            <article key={session.id} className="flex h-full flex-col rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/20 to-teal-50/20 p-5 sm:p-6 lg:p-8 shadow-lg shadow-cyan-900/10 transition hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-900/20">
              <header className="space-y-2">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-cyan-600/70">Workout {session.id}</p>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">{session.title}</h2>
                <p className="text-sm text-slate-500">{session.emphasis}</p>
              </header>

              <ul className="mt-5 sm:mt-6 space-y-3 sm:space-y-4 text-sm text-slate-600">
                {session.exercises.map((exercise) => (
                  <li key={exercise.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100 lg:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="font-medium text-slate-900 text-base sm:text-sm">{exercise.name}</span>
                      <span className="text-xs uppercase tracking-[0.3em] text-primary">
                        {exercise.primaryMuscles.join(', ')}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 lg:grid-cols-4">
                      <div>
                        <dt className="text-slate-400">セット</dt>
                        <dd className="font-semibold text-slate-900 text-sm sm:text-xs">{exercise.prescription.sets}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">レップ</dt>
                        <dd className="font-semibold text-slate-900 text-sm sm:text-xs">{exercise.prescription.reps}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">RIR</dt>
                        <dd className="font-semibold text-slate-900 text-sm sm:text-xs">{exercise.prescription.rir}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">休憩</dt>
                        <dd className="font-semibold text-slate-900 text-sm sm:text-xs">{exercise.prescription.rest}</dd>
                      </div>
                    </dl>
                    {exercise.notes && <p className="mt-3 text-xs text-slate-500 leading-relaxed">※ {exercise.notes}</p>}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5 sm:pt-6 text-xs text-slate-500 space-y-1 leading-relaxed">
                <p>推奨ペース: 週1-2回を目安にローテーション</p>
                <p>ターゲット筋群: {session.emphasis}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 lg:p-8 shadow-lg shadow-slate-200/40">
          <h2 className="text-lg font-semibold text-slate-900">次のステップ</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            気になるワークアウトを確認できたら、記録ページからセッションを開始してセットを記録しましょう。
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 text-sm">
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 sm:py-2 font-semibold text-white transition hover:bg-primary-dark min-h-touch"
            >
              記録ページへ移動
            </Link>
            <Link
              href="/workouts/history"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 sm:py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 min-h-touch"
            >
              過去の記録を見る
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
