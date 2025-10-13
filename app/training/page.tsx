"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from 'lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ensureUpcomingSession,
  startSession,
  logSessionSet,
  completeSession,
  type TrainingSessionSet,
  type UpcomingSessionPayload
} from 'lib/trainingSessions';
import type { User } from '@supabase/supabase-js';

const formatDate = (value?: string | null) => {
  if (!value) return '未定';
  return new Date(value).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' });
};


type SetFormState = {
  reps: string;
  rir: string;
  weight: string;
  notes: string;
};

const defaultFormState: SetFormState = {
  reps: '',
  rir: '',
  weight: '',
  notes: ''
};

const useRestTimer = (initial: number | null, onFinish: () => void) => {
  const [seconds, setSeconds] = useState<number | null>(initial);

  useEffect(() => {
    if (seconds === null) {
      return;
    }

    if (seconds <= 0) {
      onFinish();
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev <= 1) {
          window.clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [seconds, onFinish]);

  return { seconds, start: setSeconds } as const;
};

const useStopwatch = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const start = useCallback(() => {
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [running]);

  return { seconds, start, stop, reset } as const;
};

const secondsToClock = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function TrainingPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<UpcomingSessionPayload | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<SetFormState>(defaultFormState);
  const [isResting, setIsResting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPreviousModalOpen, setIsPreviousModalOpen] = useState(false);
  const redirectBackTo = searchParams?.get('redirect') ?? '/training';
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }),
    []
  );

  const { seconds: restSeconds, start: startRest } = useRestTimer(null, () => {
    setIsResting(false);
  });
  const {
    seconds: workSeconds,
    start: startWorkTimer,
    stop: stopWorkTimer,
    reset: resetWorkTimer
  } = useStopwatch();
  const isFormValid = formState.weight.trim() !== '' && formState.reps.trim() !== '' && formState.rir.trim() !== '';
  const isFormDirty = useMemo(
    () => Object.values(formState).some((value) => value.trim() !== ''),
    [formState]
  );
  const confirmNavigation = useCallback(() => {
    if (!isFormDirty) {
      return true;
    }
    return window.confirm('入力中の内容が保存されていません。移動すると入力が失われます。続行しますか？');
  }, [isFormDirty]);

  const handleNavigate = useCallback(
    (path: string) => {
      if (!confirmNavigation()) {
        return;
      }
      router.push(path);
    },
    [confirmNavigation, router]
  );

  useEffect(() => {
    let active = true;
    const ensureAuth = async () => {
      setLoading(true);
      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;

      if (userError) {
        console.error(userError);
      }

      if (!data?.user) {
        router.replace(`/sign-in?redirect=${encodeURIComponent(redirectBackTo)}`);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    ensureAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setPayload(null);
        router.replace(`/sign-in?redirect=${encodeURIComponent(redirectBackTo)}`);
        return;
      }
      setUser(session.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [redirectBackTo, router, supabase]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isFormDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFormDirty]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    const bootstrap = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSession = await ensureUpcomingSession(supabase);
        if (!active) return;
        setPayload(nextSession);
      } catch (fetchError) {
        if (!active) return;
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'セッションの取得に失敗しました');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!payload) return;
    if (payload.sets.length > 0) return;

    let active = true;

    ensureUpcomingSession(supabase)
      .then((next) => {
        if (!active) return;
        setPayload(next);
      })
      .catch((fetchError) => {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'セッション情報の再取得に失敗しました');
      });

    return () => {
      active = false;
    };
  }, [payload, supabase]);

  const currentSet = useMemo(() => payload?.sets.find((set) => set.performed_reps === null) ?? null, [payload]);

  const currentExerciseDetails = useMemo(() => {
    if (!payload || !currentSet) {
      return null;
    }

    const exerciseMeta = payload.template.exercises.find((exercise) => exercise.id === currentSet.exercise_id);
    if (!exerciseMeta) {
      return null;
    }

    const setsForExercise = payload.sets
      .filter((set) => set.exercise_id === currentSet.exercise_id)
      .sort((a, b) => a.set_number - b.set_number);

    const completedSets = setsForExercise.filter((set) => set.performed_reps !== null).length;

    return {
      exercise: exerciseMeta,
      totalSets: setsForExercise.length,
      completedSets,
      setNumber: currentSet.set_number,
      targetReps: exerciseMeta.prescription.reps,
      targetRir: exerciseMeta.prescription.rir,
      restSeconds: exerciseMeta.prescription.restSeconds
    } as const;
  }, [payload, currentSet]);

  useEffect(() => {
    const status = payload?.session.status;
    if (!status || status === 'planned') {
      stopWorkTimer();
      resetWorkTimer();
      return;
    }

    if (!currentSet) {
      stopWorkTimer();
      return;
    }

    if (isResting) {
      stopWorkTimer();
      return;
    }

    resetWorkTimer();
    startWorkTimer();
  }, [payload?.session.status, currentSet, isResting, resetWorkTimer, startWorkTimer, stopWorkTimer]);

  const handleStartSession = async () => {
    if (!payload || payload.session.status !== 'planned') return;

    try {
      setIsStarting(true);
  await startSession(supabase, payload.session.id);
  setError(null);
      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          session: {
            ...prev.session,
            status: 'in-progress',
            started_at: new Date().toISOString()
          }
        } satisfies UpcomingSessionPayload;
      });
    } catch (startError) {
      console.error(startError);
      setError(startError instanceof Error ? startError.message : 'セッション開始に失敗しました');
    } finally {
      setIsStarting(false);
    }
  };

  const handleFormChange = (field: keyof SetFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setFormState(defaultFormState);

  const handleLogSet = async () => {
    if (!payload || !currentSet) return;
    if (!formState.weight || !formState.reps || !formState.rir) {
      setError('重量・レップ数・RIRをすべて入力してください。');
      return;
    }

    const performedReps = Number(formState.reps);
    const performedRir = Number(formState.rir);
    const weight = Number(formState.weight);

    if (Number.isNaN(performedReps) || Number.isNaN(performedRir) || Number.isNaN(weight)) {
      setError('入力値を確認してください。');
      return;
    }

    const remainingSets = payload.sets
      .filter((set) => set.id !== currentSet.id && set.performed_reps === null)
      .sort((a, b) => {
        if (a.exercise_order === b.exercise_order) {
          return a.set_number - b.set_number;
        }
        return a.exercise_order - b.exercise_order;
      });

    const nextSet = remainingSets[0];
    let nextRestSeconds = 0;
    if (nextSet) {
      const nextExerciseMeta = payload.template.exercises.find((exercise) => exercise.id === nextSet.exercise_id);
      nextRestSeconds = nextExerciseMeta?.prescription.restSeconds ?? 0;
    }

    try {
      setIsSubmitting(true);
      await logSessionSet(supabase, currentSet.id, {
        performed_reps: performedReps,
        performed_rir: performedRir,
        weight,
        notes: formState.notes || null
      });
      setError(null);

      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sets: prev.sets.map((set) =>
            set.id === currentSet.id
              ? {
                  ...set,
                  performed_reps: performedReps,
                  performed_rir: performedRir,
                  weight,
                  notes: formState.notes || null,
                  logged_at: new Date().toISOString()
                }
              : set
          )
        } satisfies UpcomingSessionPayload;
      });

      if (nextSet && nextRestSeconds > 0) {
        stopWorkTimer();
        resetWorkTimer();
        startRest(nextRestSeconds);
        setIsResting(true);
      } else {
        startRest(null);
        setIsResting(false);
        stopWorkTimer();
        resetWorkTimer();
      }

      resetForm();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : 'セット記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipRest = () => {
    startRest(null);
    setIsResting(false);
    resetWorkTimer();
  };

  const handleCompleteSession = async () => {
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await completeSession(supabase, payload.session.id);
      const next = await ensureUpcomingSession(supabase);
      setPayload(next);
      setIsResting(false);
      startRest(null);
      resetForm();
      stopWorkTimer();
      resetWorkTimer();
      setError(null);
    } catch (completeError) {
      console.error(completeError);
      setError(completeError instanceof Error ? completeError.message : 'セッションの完了に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previousSessionGroups = useMemo(() => {
    const previous = payload?.previousSession;
    if (!previous || !previous.sets.length) {
      return [] as Array<{ id: string; name: string; sets: TrainingSessionSet[] }>;
    }

    const grouped = new Map<string, { name: string; order: number; sets: TrainingSessionSet[] }>();
    previous.sets.forEach((set) => {
      if (!grouped.has(set.exercise_id)) {
        grouped.set(set.exercise_id, {
          name: set.exercise_name,
          order: set.exercise_order,
          sets: []
        });
      }
      grouped.get(set.exercise_id)?.sets.push(set);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, value]) => ({
        id,
        name: value.name,
        sets: value.sets.sort((a, b) => a.set_number - b.set_number)
      }));
  }, [payload]);

  const goHome = useCallback(() => handleNavigate('/'), [handleNavigate]);
  const goTraining = useCallback(() => handleNavigate('/training'), [handleNavigate]);
  const goWorkoutList = useCallback(() => handleNavigate('/workouts'), [handleNavigate]);
  const goHistory = useCallback(() => handleNavigate('/workouts/history'), [handleNavigate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-500">
        <p className="text-sm">読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-600">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-500">
        <p className="text-sm">セッション情報が取得できませんでした。</p>
      </main>
    );
  }

  const totalSetCount = payload.sets.length;
  const hasSets = totalSetCount > 0;
  const completedSetCount = payload.sets.filter((set) => set.performed_reps !== null).length;
  const allSetsCompleted = hasSets && completedSetCount === totalSetCount;
  const statusLabels = {
    planned: '未開始',
    'in-progress': '進行中',
    completed: '完了済み'
  } satisfies Record<'planned' | 'in-progress' | 'completed', string>;
  const statusStyles = {
    planned: 'border-slate-200 bg-slate-100 text-slate-600',
    'in-progress': 'border-amber-400/40 bg-amber-50 text-amber-600',
    completed: 'border-emerald-400/60 bg-emerald-50 text-emerald-600'
  } satisfies Record<'planned' | 'in-progress' | 'completed', string>;
  const sessionStatus = payload.session.status;
  const activeExercise = currentExerciseDetails?.exercise;

  const remainingSetsForExercise = currentExerciseDetails
    ? Math.max(currentExerciseDetails.totalSets - currentExerciseDetails.setNumber, 0)
    : 0;

  const handleSignOut = async () => {
    if (!confirmNavigation()) {
      return;
    }
    await supabase.auth.signOut();
    setPayload(null);
    setIsResting(false);
    startRest(null);
    stopWorkTimer();
    resetWorkTimer();
    router.replace('/sign-in');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-cyan-100/20 bg-gradient-to-r from-white/95 to-cyan-50/80 shadow-sm shadow-cyan-900/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={goHome}
              className="text-sm font-semibold text-slate-900 transition hover:text-cyan-600 sm:text-base"
            >
              Strength Guide
            </button>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
            <span className="text-xs text-slate-500">{payload.session.template_code} セッション</span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <button
              onClick={goHome}
              className="rounded-full border border-transparent px-3 py-1 font-medium text-slate-500 transition hover:border-slate-200 hover:text-slate-900"
            >
              ホーム
            </button>
            <button
              onClick={goTraining}
              className="rounded-full border border-cyan-600/40 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-3 py-1 font-semibold text-cyan-700 transition hover:from-cyan-500/20 hover:to-teal-500/20"
            >
              記録ページ
            </button>
            <button
              onClick={goWorkoutList}
              className="rounded-full border border-transparent px-3 py-1 font-medium text-slate-500 transition hover:border-slate-200 hover:text-slate-900"
            >
              ワークアウト一覧
            </button>
            <button
              onClick={goHistory}
              className="rounded-full border border-transparent px-3 py-1 font-medium text-slate-500 transition hover:border-slate-200 hover:text-slate-900"
            >
              過去の記録
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-6 shadow-lg shadow-cyan-900/10 lg:p-8">
        <div className="space-y-4 lg:space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[sessionStatus]}`}
            >
              {statusLabels[sessionStatus]}
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-cyan-600">Workout {payload.session.template_code}</span>
          </div>
          <div className="lg:flex lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{payload.template.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{payload.template.emphasis}</p>
            </div>
            <div className="mt-4 hidden gap-2 text-xs text-slate-500 lg:flex">
              <span>今日: {todayLabel}</span>
              {payload.session.started_at && <span>開始: {formatDate(payload.session.started_at)}</span>}
              {payload.session.completed_at && <span>完了: {formatDate(payload.session.completed_at)}</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-[13px] text-slate-500 sm:grid-cols-3 lg:hidden">
            <span>今日: {todayLabel}</span>
            {payload.session.started_at && <span>開始: {formatDate(payload.session.started_at)}</span>}
            {payload.session.completed_at && <span>完了: {formatDate(payload.session.completed_at)}</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/50 via-white to-teal-50/30 p-5 shadow-sm shadow-cyan-900/5 transition hover:shadow-md hover:shadow-cyan-900/10">
              <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-600/80">セット進捗</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{completedSetCount}<span className="text-2xl text-cyan-400">/{totalSetCount}</span></p>
              <p className="mt-2 text-xs text-slate-500">記録済みセット / 全セット</p>
            </div>
            {activeExercise && currentExerciseDetails && (
              <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-teal-50/50 to-cyan-50/30 p-5 text-sm text-slate-600 shadow-sm shadow-cyan-900/5 transition hover:shadow-md hover:shadow-cyan-900/10">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">次のセット</p>
                <p className="mt-3 text-lg font-medium text-slate-900">{activeExercise.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Set {currentExerciseDetails.setNumber}/{currentExerciseDetails.totalSets}
                </p>
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 lg:text-sm">
            <span>ログイン中: {user.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300"
            >
              サインアウト
            </button>
          </div>
        )}

        {payload.previousSession && (
          <div className="mt-6 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">前回のトレーニング</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-slate-900">Workout {payload.previousSession.session.template_code}</span>
              <span>{formatDate(payload.previousSession.session.completed_at)}</span>
              <span>{payload.previousSession.sets.filter((set) => set.performed_reps !== null).length} セット記録済み</span>
            </div>
            <button
              onClick={() => setIsPreviousModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              記録を確認
            </button>
          </div>
        )}

        {sessionStatus === 'planned' && (
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">準備ができたら「トレーニングを開始」を押して最初の種目に進みましょう。</p>
            <button
              onClick={handleStartSession}
              disabled={isStarting}
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-40"
            >
              {isStarting ? '開始しています...' : 'トレーニングを開始'}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 lg:p-8">
        <div className="lg:flex lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">ワークセット</h2>
            <p className="mt-1 text-sm text-slate-500">スマホ・タブレット・PC いずれでも入力しやすいカードレイアウトです。</p>
          </div>
          {sessionStatus !== 'planned' && hasSets && !allSetsCompleted && currentExerciseDetails && (
            <div className="mt-4 hidden items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500 lg:flex">
              <span className="font-semibold text-slate-900">
                {currentExerciseDetails.setNumber}/{currentExerciseDetails.totalSets}
              </span>
              <span>セット進行中</span>
            </div>
          )}
        </div>

        {sessionStatus === 'planned' && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
            セッションを開始すると現在の種目がここに表示されます。
          </div>
        )}

        {sessionStatus !== 'planned' && hasSets && !allSetsCompleted && currentExerciseDetails && (
          <div className="mt-6 space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-6">
            <header className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:col-span-2">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary">現在の種目</p>
                <h3 className="text-xl font-semibold text-slate-900">{activeExercise?.name}</h3>
                <p className="text-sm text-slate-500">
                  Set {currentExerciseDetails.setNumber} / {currentExerciseDetails.totalSets}（残り {remainingSetsForExercise} セット）
                </p>
              </div>
              {activeExercise?.notes && <p className="text-sm text-slate-500">{activeExercise.notes}</p>}
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">目標レップ</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{currentExerciseDetails.targetReps}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">目標RIR</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{currentExerciseDetails.targetRir}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">推奨休憩</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {currentExerciseDetails.restSeconds ? `${Math.round(currentExerciseDetails.restSeconds / 60)}分` : '指定なし'}
                  </p>
                </div>
              </div>
            </header>

            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-6 lg:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                {isResting ? 'Rest Timer' : 'Set Timer'}
              </span>
              <span className="text-5xl font-semibold text-slate-900">
                {isResting ? secondsToClock(restSeconds ?? currentExerciseDetails.restSeconds ?? 0) : secondsToClock(workSeconds)}
              </span>
              {isResting ? (
                <div className="flex flex-col items-center gap-3 text-xs text-amber-600">
                  <p>休憩が終わったら次のセットを始めましょう。</p>
                  <button
                    onClick={handleSkipRest}
                    className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-100"
                  >
                    休憩を終了
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">フォームを入力して「セット完了」を押してください。</p>
              )}
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:col-span-3 lg:grid-cols-2 xl:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs text-slate-500">重量 (kg)</span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={formState.weight}
                  onChange={(event) => handleFormChange('weight', event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-primary focus:outline-none"
                  disabled={isSubmitting || isResting}
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs text-slate-500">実施レップ数</span>
                <input
                  type="number"
                  min={0}
                  value={formState.reps}
                  onChange={(event) => handleFormChange('reps', event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-primary focus:outline-none"
                  disabled={isSubmitting || isResting}
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs text-slate-500">実施RIR</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={formState.rir}
                  onChange={(event) => handleFormChange('rir', event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-primary focus:outline-none"
                  disabled={isSubmitting || isResting}
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm lg:col-span-2 xl:col-span-3">
                <span className="text-xs text-slate-500">メモ (任意)</span>
                <textarea
                  value={formState.notes}
                  onChange={(event) => handleFormChange('notes', event.target.value)}
                  className="h-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-primary focus:outline-none xl:h-32"
                  disabled={isSubmitting || isResting}
                />
              </label>

              <button
                onClick={handleLogSet}
                disabled={isSubmitting || isResting || !isFormValid}
                className="mt-1 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-40 lg:col-span-2 xl:col-span-3"
              >
                {isSubmitting ? '記録中...' : 'セット完了'}
              </button>
              {!isResting && currentExerciseDetails.restSeconds > 0 && (
                <span className="text-center text-xs text-slate-500 lg:col-span-2 xl:col-span-3">
                  完了後に {Math.round(currentExerciseDetails.restSeconds / 60)} 分の休憩がスタートします
                </span>
              )}
            </div>
          </div>
        )}

        {sessionStatus !== 'planned' && hasSets && !allSetsCompleted && !currentExerciseDetails && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
            次のセット情報を読み込んでいます...
          </div>
        )}

        {allSetsCompleted && sessionStatus !== 'completed' && (
          <div className="mt-6 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 lg:flex lg:items-center lg:justify-between lg:space-y-0">
            <h3 className="text-lg font-semibold">全セット完了！</h3>
            <p className="text-sm">「セッション完了」ボタンを押して記録を締めましょう。</p>
            <button
              onClick={handleCompleteSession}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40 lg:w-auto"
            >
              {isSubmitting ? '処理中...' : 'セッション完了'}
            </button>
          </div>
        )}

        {sessionStatus === 'completed' && (
          <div className="mt-6 space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <h3 className="text-lg font-semibold">このセッションは完了済みです</h3>
            <p className="text-sm">トップページに戻るか、次のセッションを開始しましょう。</p>
          </div>
        )}
      </section>

      </main>

      {isPreviousModalOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="前回の記録"
          onClick={() => setIsPreviousModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/30"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Previous Session</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">前回の記録</h3>
                {payload?.previousSession?.session.completed_at && (
                  <p className="text-xs text-slate-500">
                    完了日時: {formatDate(payload.previousSession.session.completed_at)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsPreviousModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                閉じる
              </button>
            </header>

            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {previousSessionGroups.length === 0 ? (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  表示できるセットがありません。
                </p>
              ) : (
                previousSessionGroups.map((group) => (
                  <article key={group.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <header className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900">{group.name}</h4>
                      <span className="text-xs text-slate-500">{group.sets.length} セット</span>
                    </header>
                    <ul className="mt-3 space-y-2 text-xs text-slate-600">
                      {group.sets.map((set) => (
                        <li
                          key={set.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                        >
                          <span className="font-semibold text-slate-900">Set {set.set_number}</span>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span>重量: {set.weight !== null ? `${set.weight} kg` : '-'}</span>
                            <span>レップ: {set.performed_reps ?? '-'}</span>
                            <span>RIR: {set.performed_rir ?? '-'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
