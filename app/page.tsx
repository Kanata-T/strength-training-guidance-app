"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from 'lib/supabaseClient';
import {
  ensureUpcomingSession,
  type UpcomingSessionPayload
} from 'lib/trainingSessions';
import { trainingPreferencesSchema, buildPlan, type TrainingPreferences } from '../lib/trainingPlan';

const DEFAULT_PREFS: TrainingPreferences = {
  experienceLevel: 'intermediate',
  availableDays: 4,
  equipmentAccess: 'full-machines',
  focusArea: 'balanced',
  includeIsolation: true
};

const experiences = [
  { value: 'beginner', label: '初心者' },
  { value: 'intermediate', label: '中級者' },
  { value: 'advanced', label: '上級者' }
] as const;

const focusAreas = [
  { value: 'balanced', label: 'バランス' },
  { value: 'upper-priority', label: '上半身重点' },
  { value: 'lower-priority', label: '下半身重点' }
] as const;

const NAV_LINKS = [
  { href: '/', label: 'ホーム' },
  { href: '/training', label: '記録ページ' },
  { href: '/workouts', label: 'ワークアウト一覧' },
  { href: '/workouts/history', label: '過去の記録' }
] as const;

type SiteHeaderProps = {
  activeHref: string;
};

const SiteHeader = ({ activeHref }: SiteHeaderProps) => (
  <header className="sticky top-0 z-20 border-b border-cyan-100/20 bg-gradient-to-r from-white/95 to-cyan-50/80 shadow-sm shadow-cyan-900/5 backdrop-blur">
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm font-semibold text-slate-900 transition hover:text-cyan-600 sm:text-base">
        Strength Guide
      </Link>
      <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {NAV_LINKS.map((link) => {
          const isActive = link.href === activeHref;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1 font-medium transition ${
                isActive
                  ? 'border border-cyan-600/40 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-700 hover:from-cyan-500/20 hover:to-teal-500/20'
                  : 'border border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  </header>
);

const formatDate = (value?: string | null) => {
  if (!value) return '未記録';
  return new Date(value).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' });
};


export default function HomePage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionPayload, setSessionPayload] = useState<UpcomingSessionPayload | null>(null);
  const [preferences, setPreferences] = useState<TrainingPreferences>(DEFAULT_PREFS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const plan = useMemo(() => buildPlan(preferences), [preferences]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        setLoading(true);
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;

        if (authError) {
          console.error(authError);
        }

        if (!data?.user) {
          setUser(null);
          setSessionPayload(null);
          setLoading(false);
          return;
        }

        setUser(data.user);
        const payload = await ensureUpcomingSession(supabase);
        if (!active) return;
        setSessionPayload(payload);
        setError(null);
      } catch (bootstrapError) {
        if (!active) return;
        console.error(bootstrapError);
        setError(bootstrapError instanceof Error ? bootstrapError.message : 'データの取得に失敗しました');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setSessionPayload(null);
        return;
      }
      setUser(session.user);
      ensureUpcomingSession(supabase)
        .then((payload) => {
          if (!payload) return;
          setSessionPayload(payload);
          setError(null);
        })
        .catch((fetchError) => {
          console.error(fetchError);
          setError(fetchError instanceof Error ? fetchError.message : 'データの取得に失敗しました');
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionPayload(null);
  };

  const updatePreferences = (partial: Partial<TrainingPreferences>) => {
    const next = { ...preferences, ...partial };
    const parsed = trainingPreferencesSchema.safeParse(next);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setErrors({ [issue.path.join('.')]: issue.message });
      return;
    }

    setErrors({});
    setPreferences(parsed.data);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <SiteHeader activeHref="/" />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10 text-slate-600 sm:px-6 lg:px-8">
          読み込み中...
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <SiteHeader activeHref="/" />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-8 shadow-xl shadow-cyan-900/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">個人用トレーニングガイド</h1>
                <p className="mt-2 text-sm text-slate-600">
                  科学的根拠に基づく高負荷マシントレーニングプロトコルを、あなたの状態に合わせて活用しましょう。
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <span className="text-xs uppercase tracking-[0.3em] text-cyan-600">Workout Cycle</span>
                <p>ワークアウトは A → B → C → D の順番で自動提案されます。</p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-600 hover:to-teal-600"
                >
                  サインインして始める
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">経験レベル</span>
                <select
                  value={preferences.experienceLevel}
                  onChange={(event) => updatePreferences({ experienceLevel: event.target.value as TrainingPreferences['experienceLevel'] })}
                  className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                >
                  {experiences.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">週あたりトレーニング日数</span>
                <input
                  type="number"
                  min={3}
                  max={6}
                  value={preferences.availableDays}
                  onChange={(event) => updatePreferences({ availableDays: Number(event.target.value) as TrainingPreferences['availableDays'] })}
                  className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
                {errors.availableDays && <span className="text-xs text-red-600">{errors.availableDays}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">フォーカス領域</span>
                <select
                  value={preferences.focusArea}
                  onChange={(event) => updatePreferences({ focusArea: event.target.value as TrainingPreferences['focusArea'] })}
                  className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                >
                  {focusAreas.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">アイソレーション種目を含める</span>
                <select
                  value={preferences.includeIsolation ? 'yes' : 'no'}
                  onChange={(event) => updatePreferences({ includeIsolation: event.target.value === 'yes' })}
                  className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value="yes">含める</option>
                  <option value="no">除外</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/20 to-teal-50/20 p-6 shadow-lg shadow-cyan-900/10">
            <header className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-slate-900">推奨プラン</h2>
              <p className="text-sm text-slate-600">頻度: 週{Math.min(preferences.availableDays, 4)}日 / 目標ボリューム: 筋群あたり約{plan.totalVolumeTargetPerMuscle}セット</p>
            </header>

            <div className="mt-6 space-y-6">
              {plan.sessions.map((session) => (
                <article key={session.id} className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/30 p-5 shadow-sm shadow-cyan-900/5">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {session.title}
                    <span className="ml-2 text-sm font-normal text-slate-500">{session.emphasis}</span>
                  </h3>

                  <ul className="mt-4 space-y-3">
                    {session.exercises.map((exercise) => (
                      <li key={exercise.id} className="rounded-xl border border-cyan-100/60 bg-white/80 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-base font-medium text-slate-900">{exercise.name}</span>
                          <span className="text-xs uppercase tracking-wide text-cyan-600">
                            {exercise.primaryMuscles.join(', ')}
                          </span>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 md:grid-cols-4">
                          <div>
                            <dt className="text-slate-400">セット</dt>
                            <dd>{exercise.prescription.sets}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">レップ</dt>
                            <dd>{exercise.prescription.reps}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">RIR</dt>
                            <dd>{exercise.prescription.rir}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">休憩</dt>
                            <dd>{exercise.prescription.rest}</dd>
                          </div>
                        </dl>
                        {exercise.notes && <p className="mt-3 text-xs text-slate-500">※ {exercise.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <section className="mt-8">
              <h4 className="text-lg font-semibold text-slate-900">推奨事項</h4>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {plan.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          </section>
        </main>
      </div>
    );
  }

  const today = new Date();
  const todayLabel = today.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const sessionStatus = sessionPayload?.session.status ?? 'planned';
  const statusLabel: Record<'planned' | 'in-progress' | 'completed', string> = {
    planned: '未開始',
    'in-progress': '実施中',
    completed: '完了済み'
  };

  const startButtonLabel = (() => {
    if (!sessionPayload) return 'トレーニングを見る';
    if (sessionPayload.session.status === 'planned') return 'はじめる';
    if (sessionPayload.session.status === 'in-progress') return '続きから';
    return '記録を見る';
  })();

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <SiteHeader activeHref="/" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-6 shadow-xl shadow-cyan-900/10">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-600">User</p>
                <h1 className="text-2xl font-semibold text-slate-900">{user.email}</h1>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-cyan-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
              >
                サインアウト
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>{todayLabel}</span>
            </div>
            {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </header>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/20 to-teal-50/20 p-6 shadow-xl shadow-cyan-900/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-600">今日のトレーニング</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {sessionPayload ? `Workout ${sessionPayload.session.template_code}` : 'セッション情報なし'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {sessionPayload ? sessionPayload.template.emphasis : 'サインインすると次のセッションが表示されます。'}
                </p>
                {sessionPayload && (
                  <p className="mt-2 text-xs text-slate-500">
                    状態: {statusLabel[sessionStatus]}
                  </p>
                )}
              </div>
              <Link
                href="/training"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-600 hover:to-teal-600"
              >
                {startButtonLabel}
              </Link>
            </div>

            {sessionPayload && (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/40 px-4 py-3 text-sm shadow-sm shadow-cyan-900/5">
                  <p className="text-xs uppercase tracking-widest text-cyan-600">今日</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{todayLabel}</p>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-teal-50/30 px-4 py-3 text-sm shadow-sm shadow-cyan-900/5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">種目数</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{sessionPayload.template.exercises.length}</p>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-teal-50/30 px-4 py-3 text-sm shadow-sm shadow-cyan-900/5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">総セット</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{sessionPayload.sets.length}</p>
                </div>
              </div>
            )}
          </div>

          {sessionPayload?.previousSession && (
            <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/20 to-teal-50/20 p-6 shadow-xl shadow-cyan-900/10 lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-600">前回</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Workout {sessionPayload.previousSession.session.template_code}</h3>
                  <p className="mt-1 text-sm text-slate-600">完了日: {formatDate(sessionPayload.previousSession.session.completed_at)}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    記録済みセット: {sessionPayload.previousSession.sets.filter((set) => set.performed_reps !== null).length} / {sessionPayload.previousSession.sets.length}
                  </p>
                </div>
                <Link
                  href="/training"
                  className="inline-flex w-full items-center justify-center rounded-full border border-cyan-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 sm:w-auto"
                >
                  記録を確認する
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/20 to-teal-50/20 p-6 shadow-xl shadow-cyan-900/10 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-600">今まで</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">プログレス</h3>
                <p className="mt-2 text-sm text-slate-600">
                  これまでのワークアウト履歴は「過去の記録」ページで確認できます。完了済みセッションのボリュームやセット数を一覧で振り返りましょう。
                </p>
              </div>
              <Link
                href="/workouts/history"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-600 hover:to-teal-600 sm:w-auto"
              >
                過去の記録を見る
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">記録ページでセットを完了すると履歴が自動更新されます。</p>
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/20 to-teal-50/20 p-6 shadow-xl shadow-cyan-900/10 lg:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-600">クイックアクセス</p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/training"
                className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/40 px-4 py-4 text-center shadow-sm shadow-cyan-900/5 transition hover:border-cyan-200 hover:shadow-md hover:shadow-cyan-900/10 sm:text-left"
              >
                <span className="block font-semibold text-slate-900">トレーニングセッション</span>
                <span className="mt-1 block text-xs text-slate-500">記録を開始</span>
              </Link>
              <Link
                href="/workouts"
                className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-teal-50/30 px-4 py-4 text-center shadow-sm shadow-cyan-900/5 transition hover:border-cyan-200 hover:shadow-md hover:shadow-cyan-900/10 sm:text-left"
              >
                <span className="block font-semibold text-slate-900">ワークアウト一覧</span>
                <span className="mt-1 block text-xs text-slate-500">種目を確認</span>
              </Link>
              <Link
                href="/workouts/history"
                className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-teal-50/30 px-4 py-4 text-center shadow-sm shadow-cyan-900/5 transition hover:border-cyan-200 hover:shadow-md hover:shadow-cyan-900/10 sm:text-left"
              >
                <span className="block font-semibold text-slate-900">過去の記録</span>
                <span className="mt-1 block text-xs text-slate-500">履歴を振り返る</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
