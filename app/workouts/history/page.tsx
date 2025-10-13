"use client";

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from 'lib/supabaseClient';
import {
  fetchExerciseSetHistory,
  fetchProgressSummaries,
  type ExerciseSetHistory,
  type SessionProgressSummary
} from 'lib/trainingSessions';

const NAV_LINKS: Array<{ href: string; label: string; active?: boolean }> = [
  { href: '/', label: 'ホーム' },
  { href: '/training', label: '記録ページ' },
  { href: '/workouts', label: 'ワークアウト一覧' },
  { href: '/workouts/history', label: '過去の記録', active: true }
];

const formatDate = (value?: string | null) => {
  if (!value) return '未定';
  return new Date(value).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '未定';
  return new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
};

const formatDateLabel = (value: string) => {
  return new Date(value).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
};

const formatNumber = (value: number, unit?: string) => {
  if (Number.isNaN(value)) return '―';
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return unit ? `${formatted}${unit}` : formatted;
};

type ChartPoint = {
  label: string;
  value: number;
  timestamp: number;
};

const buildChartPoints = (entries: ExerciseSetHistory[], resolver: (entry: ExerciseSetHistory) => number | null) => {
  const points: ChartPoint[] = [];

  for (const entry of entries) {
    const value = resolver(entry);
    if (value === null || Number.isNaN(value)) {
      continue;
    }

    const timestamp = new Date(entry.sessionCompletedAt).getTime() + entry.setNumber / 100;
    points.push({
      label: `${formatDateLabel(entry.sessionCompletedAt)} #${entry.setNumber}`,
      value,
      timestamp
    });
  }

  return points;
};

const computeEffortScore = (entry: ExerciseSetHistory) => {
  if (entry.weight === null || entry.performedReps === null || entry.performedRir === null) {
    return null;
  }
  const reps = entry.performedReps;
  const rirReserve = Math.max(0, 10 - entry.performedRir);
  const intensityFactor = rirReserve === 0 ? 1 : rirReserve;
  return entry.weight * reps * intensityFactor;
};

type LineChartProps = {
  points: ChartPoint[];
  color: string;
};

const LineChart = ({ points, color }: LineChartProps) => {
  const gradientId = useId();

  if (points.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">記録がまだありません。</p>;
  }

  if (points.length === 1) {
    const single = points[0];
    return (
      <div className="mt-4 flex h-40 w-full flex-col items-start justify-end">
        <div className="text-3xl font-semibold text-slate-900">{formatNumber(single.value)}</div>
        <span className="mt-1 text-xs text-slate-500">{single.label}</span>
      </div>
    );
  }

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const values = sorted.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const topPadding = 8;
  const bottomPadding = 92;

  const coordinates = sorted.map((point, index) => {
    const x = (index / (sorted.length - 1)) * 100;
    const normalised = (point.value - min) / range;
    const y = bottomPadding - normalised * (bottomPadding - topPadding);
    return { x, y, point };
  });

  const polylinePoints = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');

  const labelAnchors = [coordinates[0], coordinates[Math.floor(coordinates.length / 2)], coordinates[coordinates.length - 1]]
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((candidate) => candidate?.point.label === item?.point.label) === index);

  return (
    <div className="mt-4">
      <div className="relative h-40 w-full overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill={`url(#${gradientId})`} opacity="0.35" />
          <polyline
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            points={polylinePoints}
          />
          {coordinates.map(({ x, y, point }) => (
            <g key={`${point.timestamp}-${point.value}`}>
              <circle cx={x} cy={y} r={1.4} fill={color} />
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        {labelAnchors.map(({ point }) => (
          <span key={point.timestamp}>{point.label}</span>
        ))}
      </div>
    </div>
  );
};

type ChartCardProps = {
  title: string;
  description: string;
  unit?: string;
  color: string;
  points: ChartPoint[];
};

const ChartCard = ({ title, description, unit, color, points }: ChartCardProps) => {
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted.at(-1) ?? null;
  const peak = sorted.length ? sorted.reduce((acc, curr) => (curr.value > acc.value ? curr : acc), sorted[0]) : null;

  return (
    <article className="rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-lg shadow-cyan-900/10">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {latest && <span className="text-xs text-slate-500">最新: {formatNumber(latest.value, unit)}</span>}
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </header>
      <LineChart points={sorted} color={color} />
      {peak && (
        <footer className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-100/60 bg-cyan-50/60 px-4 py-3 text-xs text-slate-600">
          <span>最高値: {formatNumber(peak.value, unit)}</span>
          <span>{peak.label}</span>
        </footer>
      )}
    </article>
  );
};

export default function WorkoutHistoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [summaries, setSummaries] = useState<SessionProgressSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(9);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseSetHistory[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const ensureUser = async () => {
      try {
        setAuthLoading(true);
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError) {
          console.error(authError);
        }
        if (!data?.user) {
          setUser(null);
          router.replace(`/sign-in?redirect=${encodeURIComponent('/workouts/history')}`);
          return;
        }
        setUser(data.user);
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    ensureUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        router.replace(`/sign-in?redirect=${encodeURIComponent('/workouts/history')}`);
        return;
      }
      setUser(session.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const loadSummaries = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      setLoading(true);
      const results = await fetchProgressSummaries(supabase, limit);
      setSummaries(results);
      setError(null);
    } catch (historyError) {
      console.error(historyError);
      setError(historyError instanceof Error ? historyError.message : '進捗データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [limit, supabase, user]);

  const loadExerciseHistory = useCallback(async () => {
    if (!user) {
      setExerciseHistory([]);
      setSelectedExercise(null);
      return;
    }

    try {
      setAnalyticsLoading(true);
      const data = await fetchExerciseSetHistory(supabase);
      setExerciseHistory(data);
      setSelectedExercise((prev) => {
        if (prev && data.some((entry) => entry.exerciseName === prev)) {
          return prev;
        }
        return data.length ? data[0].exerciseName : null;
      });
      setAnalyticsError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setAnalyticsError(fetchError instanceof Error ? fetchError.message : '統計データの取得に失敗しました');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!user) {
      setSummaries([]);
      return;
    }

    let active = true;
    setLoading(true);
    fetchProgressSummaries(supabase, limit)
      .then((results) => {
        if (!active) return;
        setSummaries(results);
        setError(null);
      })
      .catch((historyError) => {
        if (!active) return;
        console.error(historyError);
        setError(historyError instanceof Error ? historyError.message : '進捗データの取得に失敗しました');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [limit, supabase, user]);

  useEffect(() => {
    void loadExerciseHistory();
  }, [loadExerciseHistory]);

  const handleRefresh = useCallback(() => {
    void loadSummaries();
    void loadExerciseHistory();
  }, [loadExerciseHistory, loadSummaries]);

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + 6);
  }, []);

  const totals = useMemo(() => {
    if (summaries.length === 0) {
      return {
        totalSessions: 0,
        totalLoggedSets: 0,
        totalVolume: 0
      };
    }

    return summaries.reduce(
      (acc, summary) => {
        acc.totalSessions += 1;
        acc.totalLoggedSets += summary.loggedSets;
        acc.totalVolume += summary.totalVolume;
        return acc;
      },
      { totalSessions: 0, totalLoggedSets: 0, totalVolume: 0 }
    );
  }, [summaries]);

    const latestAnalyticsEntry = useMemo(() => {
      if (exerciseHistory.length === 0) {
        return null;
      }

      return exerciseHistory.reduce<ExerciseSetHistory | null>((acc, entry) => {
        if (!acc) {
          return entry;
        }
        const accTime = new Date(acc.sessionCompletedAt).getTime() + acc.setNumber / 100;
        const entryTime = new Date(entry.sessionCompletedAt).getTime() + entry.setNumber / 100;
        return entryTime >= accTime ? entry : acc;
      }, null);
    }, [exerciseHistory]);

    const groupedHistory = useMemo(() => {
      const groups = new Map<string, ExerciseSetHistory[]>();

      for (const entry of exerciseHistory) {
        const existing = groups.get(entry.exerciseName) ?? [];
        existing.push(entry);
        groups.set(entry.exerciseName, existing);
      }

      groups.forEach((entries, name) => {
        const sorted = [...entries].sort((a, b) => {
          const dateDiff = new Date(a.sessionCompletedAt).getTime() - new Date(b.sessionCompletedAt).getTime();
          if (dateDiff !== 0) {
            return dateDiff;
          }
          return a.setNumber - b.setNumber;
        });
        groups.set(name, sorted);
      });

      return groups;
    }, [exerciseHistory]);

    const exerciseNames = useMemo(() => {
      return Array.from(groupedHistory.keys()).sort((a, b) => a.localeCompare(b, 'ja'));
    }, [groupedHistory]);

    const exerciseEntries = useMemo(() => {
      if (!selectedExercise) {
        return [] as ExerciseSetHistory[];
      }
      return groupedHistory.get(selectedExercise) ?? [];
    }, [groupedHistory, selectedExercise]);

    const chartEntries = useMemo(() => exerciseEntries.slice(-60), [exerciseEntries]);
    const recentEntries = useMemo(() => exerciseEntries.slice(-10).reverse(), [exerciseEntries]);

    const weightPoints = useMemo(() => buildChartPoints(chartEntries, (entry) => entry.weight), [chartEntries]);
    const repPoints = useMemo(() => buildChartPoints(chartEntries, (entry) => entry.performedReps), [chartEntries]);
    const rirPoints = useMemo(() => buildChartPoints(chartEntries, (entry) => entry.performedRir), [chartEntries]);
    const effortPoints = useMemo(() => buildChartPoints(chartEntries, computeEffortScore), [chartEntries]);

    const isAnalyticsEmpty = exerciseHistory.length === 0;
    const isRefreshing = loading || analyticsLoading;

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-500">
        <p className="text-sm">認証情報を確認しています...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-500">
        <p className="text-sm">サインインページに移動します...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-cyan-100/20 bg-gradient-to-r from-white/95 to-cyan-50/80 shadow-sm shadow-cyan-900/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold text-slate-900 transition hover:text-cyan-600">
            Strength Guide
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  link.active
                    ? 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-6 shadow-lg shadow-cyan-900/10 lg:p-8">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-600">Workout History</p>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">過去のワークアウト記録</h1>
            <p className="text-sm text-slate-500">
              完了したセッションの履歴を確認して、進捗やボリュームの変化を把握しましょう。
            </p>
          </header>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>表示件数: {summaries.length}件</span>
            {latestAnalyticsEntry && (
              <span>最終記録日: {formatDateLabel(latestAnalyticsEntry.sessionCompletedAt)}</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRefreshing ? '更新中...' : '最新のデータを取得'}
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/50 via-white to-teal-50/30 p-5 shadow-sm shadow-cyan-900/5 transition hover:shadow-md hover:shadow-cyan-900/10 lg:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-600/80">セッション数</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{totals.totalSessions}</p>
            <p className="mt-2 text-xs text-slate-500">完了したワークアウトの合計</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/30 p-5 shadow-sm shadow-cyan-900/5 transition hover:shadow-md hover:shadow-cyan-900/10 lg:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-600/80">セット数</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{totals.totalLoggedSets}</p>
            <p className="mt-2 text-xs text-slate-500">記録済みセットの総数</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/50 to-teal-50/50 p-5 shadow-sm shadow-cyan-900/5 transition hover:shadow-md hover:shadow-cyan-900/10 sm:col-span-2 lg:col-span-1 lg:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-600/80">総ボリューム</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{totals.totalVolume.toLocaleString('ja-JP')} <span className="text-2xl">kg</span></p>
            <p className="mt-2 text-xs text-slate-500">重量×レップの累計</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[260px,_1fr]">
          <aside className="rounded-3xl border border-cyan-100 bg-white/80 p-4 shadow-lg shadow-cyan-900/10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">種目別統計</h2>
              <span className="text-xs text-slate-500">{exerciseNames.length}種目</span>
            </div>
            <div className="mt-4 flex max-h-[24rem] flex-col gap-2 overflow-y-auto pr-1">
              {analyticsLoading && <span className="text-xs text-slate-500">読み込み中...</span>}
              {!analyticsLoading && exerciseNames.length === 0 && (
                <span className="text-xs text-slate-500">記録済みの種目がありません。</span>
              )}
              {exerciseNames.map((name) => {
                const isActive = name === selectedExercise;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedExercise(name)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'border-cyan-300 bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 shadow-md shadow-cyan-900/10'
                        : 'border-transparent bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            {analyticsError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {analyticsError}
              </div>
            )}

            {selectedExercise ? (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard
                    title="重量"
                    description="セットごとの実測重量の推移"
                    unit=" kg"
                    color="#0891b2"
                    points={weightPoints}
                  />
                  <ChartCard
                    title="レップ数"
                    description="記録された反復回数"
                    unit=" 回"
                    color="#10b981"
                    points={repPoints}
                  />
                  <ChartCard
                    title="RIR"
                    description="主観的余力 (Reps In Reserve)"
                    color="#6366f1"
                    points={rirPoints}
                  />
                  <ChartCard
                    title="負荷指数"
                    description="重量 × レップ数 × (10 - RIR)"
                    unit=" pts"
                    color="#f97316"
                    points={effortPoints}
                  />
                </div>

                <section className="rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-lg shadow-cyan-900/10">
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">最近の記録</h3>
                    <span className="text-xs text-slate-500">最新10件</span>
                  </header>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-cyan-100 text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-widest text-slate-500">
                          <th className="py-2 pr-4">日付</th>
                          <th className="py-2 pr-4">セット</th>
                          <th className="py-2 pr-4">重量</th>
                          <th className="py-2 pr-4">レップ</th>
                          <th className="py-2 pr-4">RIR</th>
                          <th className="py-2 pr-4">負荷指数</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-50 text-slate-700">
                        {recentEntries.map((entry) => {
                          const effort = computeEffortScore(entry);
                          return (
                            <tr key={`${entry.sessionId}-${entry.setNumber}-${entry.sessionCompletedAt}`}>
                              <td className="whitespace-nowrap py-2 pr-4 text-xs text-slate-500">
                                {formatDateLabel(entry.sessionCompletedAt)}
                              </td>
                              <td className="py-2 pr-4 text-xs text-slate-500">#{entry.setNumber}</td>
                              <td className="py-2 pr-4">{entry.weight !== null ? formatNumber(entry.weight, ' kg') : '―'}</td>
                              <td className="py-2 pr-4">{entry.performedReps !== null ? formatNumber(entry.performedReps, ' 回') : '―'}</td>
                              <td className="py-2 pr-4">{entry.performedRir !== null ? formatNumber(entry.performedRir) : '―'}</td>
                              <td className="py-2 pr-4">{effort !== null ? formatNumber(effort, ' pts') : '―'}</td>
                            </tr>
                          );
                        })}
                        {recentEntries.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                              記録済みのセットがありません。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <div className="rounded-3xl border border-cyan-100 bg-white/90 p-6 text-sm text-slate-600 shadow-lg shadow-cyan-900/10">
                {isAnalyticsEmpty ? '可視化する記録がありません。ワークアウトを記録すると統計が表示されます。' : '種目を選択してください。'}
              </div>
            )}
          </div>
        </section>

        <section>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`history-skeleton-${index}`} className="h-36 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : summaries.length === 0 ? (
            <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              まだ完了したワークアウトがありません。セッションを完了すると履歴が表示されます。
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {summaries.map((summary) => (
                <article key={summary.session.id} className="rounded-2xl border border-cyan-100/60 bg-gradient-to-br from-cyan-50/30 to-teal-50/20 p-5 text-sm text-slate-600 transition hover:border-cyan-200 hover:from-cyan-50/50 hover:to-teal-50/40 hover:shadow-md hover:shadow-cyan-900/10">
                  <header className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">Workout {summary.session.template_code}</span>
                    <span>{formatShortDate(summary.session.completed_at)}</span>
                  </header>
                  <div className="mt-4 space-y-3 text-xs text-slate-500">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400">記録セット</span>
                      <span className="text-sm font-semibold text-slate-900">{summary.loggedSets}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400">総ボリューム</span>
                      <span className="text-sm font-semibold text-slate-900">{summary.totalVolume.toLocaleString('ja-JP')} kg</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400">完了日時</span>
                      <span className="text-sm font-medium text-slate-900">{formatDate(summary.session.completed_at)}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400">予定セット</span>
                      <span className="text-sm font-semibold text-slate-900">{summary.totalSets}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {summaries.length >= limit && summaries.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              もっと表示する
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
