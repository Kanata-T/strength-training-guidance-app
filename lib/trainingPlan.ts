import { z } from 'zod';

export const trainingPreferencesSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  availableDays: z.number().min(3).max(6),
  equipmentAccess: z.enum(['full-machines', 'limited-machines']),
  focusArea: z.enum(['balanced', 'upper-priority', 'lower-priority']),
  includeIsolation: z.boolean().default(true)
});

export type TrainingPreferences = z.infer<typeof trainingPreferencesSchema>;

export type SetPrescription = {
  sets: number;
  reps: string;
  rir: string;
  rest: string;
  restSeconds: number;
};

export type Exercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  prescription: SetPrescription;
  notes?: string;
};

export type Session = {
  id: string;
  title: string;
  emphasis: string;
  exercises: Exercise[];
};

export type WeeklyPlan = {
  split: 'upper-lower';
  totalVolumeTargetPerMuscle: number;
  sessions: Session[];
  recommendations: string[];
};

export const BASE_PLAN: Session[] = [
  {
    id: 'A',
    title: 'Workout A',
    emphasis: 'Upper — Push emphasis',
    exercises: [
      {
        id: 'machine-chest-press',
        name: 'チェストプレスマシン',
        primaryMuscles: ['chest', 'triceps'],
  prescription: { sets: 4, reps: '6-10', rir: 'RIR 2-3', rest: '3分', restSeconds: 180 },
        notes: 'ボトムで胸をストレッチし、トップでテンションを抜かない'
      },
      {
        id: 'machine-shoulder-press',
        name: 'ショルダープレスマシン',
        primaryMuscles: ['shoulders', 'triceps'],
  prescription: { sets: 3, reps: '8-12', rir: 'RIR 1-2', rest: '3分', restSeconds: 180 }
      },
      {
        id: 'pec-deck',
        name: 'ペックデックフライ',
        primaryMuscles: ['chest'],
  prescription: { sets: 3, reps: '10-15', rir: 'RIR 1-2', rest: '2分', restSeconds: 120 }
      },
      {
        id: 'machine-lateral-raise',
        name: 'マシンラテラルレイズ',
        primaryMuscles: ['shoulders'],
  prescription: { sets: 4, reps: '12-15', rir: 'RIR 1', rest: '2分', restSeconds: 120 }
      },
      {
        id: 'machine-triceps-pushdown',
        name: 'トライセプスマシン',
        primaryMuscles: ['triceps'],
  prescription: { sets: 3, reps: '10-15', rir: 'RIR 1-2', rest: '2分', restSeconds: 120 }
      }
    ]
  },
  {
    id: 'B',
    title: 'Workout B',
    emphasis: 'Lower — Quads emphasis',
    exercises: [
      {
        id: 'machine-leg-press',
        name: 'レッグプレスマシン',
        primaryMuscles: ['quads', 'glutes'],
  prescription: { sets: 4, reps: '8-12', rir: 'RIR 2-3', rest: '3-4分', restSeconds: 210 }
      },
      {
        id: 'machine-leg-extension',
        name: 'レッグエクステンション',
        primaryMuscles: ['quads'],
  prescription: { sets: 3, reps: '12-15', rir: 'RIR 1', rest: '2分', restSeconds: 120 }
      },
      {
        id: 'machine-hack-squat',
        name: 'ハックスクワットマシン',
        primaryMuscles: ['quads', 'glutes'],
  prescription: { sets: 3, reps: '8-12', rir: 'RIR 1-2', rest: '3分', restSeconds: 180 }
      },
      {
        id: 'machine-seated-calf',
        name: 'シーテッドカーフレイズ',
        primaryMuscles: ['calves'],
  prescription: { sets: 4, reps: '10-15', rir: 'RIR 1-2', rest: '90秒', restSeconds: 90 }
      }
    ]
  },
  {
    id: 'C',
    title: 'Workout C',
    emphasis: 'Upper — Pull emphasis',
    exercises: [
      {
        id: 'machine-lat-pulldown',
        name: 'ラットプルダウンマシン',
        primaryMuscles: ['lats', 'biceps'],
  prescription: { sets: 4, reps: '8-12', rir: 'RIR 2-3', rest: '3分', restSeconds: 180 }
      },
      {
        id: 'machine-seated-row',
        name: 'シーテッドローマシン',
        primaryMuscles: ['back'],
  prescription: { sets: 3, reps: '8-12', rir: 'RIR 1-2', rest: '3分', restSeconds: 180 }
      },
      {
        id: 'machine-rear-delt',
        name: 'リアデルトフライマシン',
        primaryMuscles: ['rear-delts'],
  prescription: { sets: 3, reps: '12-15', rir: 'RIR 1', rest: '2分', restSeconds: 120 }
      },
      {
        id: 'machine-biceps-curl',
        name: 'バイセプスマシン',
        primaryMuscles: ['biceps'],
  prescription: { sets: 3, reps: '10-15', rir: 'RIR 1-2', rest: '2分', restSeconds: 120 }
      },
      {
        id: 'cable-face-pull',
        name: 'フェイスプル',
        primaryMuscles: ['rear-delts', 'upper-back'],
  prescription: { sets: 3, reps: '15-20', rir: 'RIR 1-2', rest: '90秒', restSeconds: 90 }
      }
    ]
  },
  {
    id: 'D',
    title: 'Workout D',
    emphasis: 'Lower — Posterior emphasis',
    exercises: [
      {
        id: 'machine-leg-curl',
        name: 'シーテッドレッグカール',
        primaryMuscles: ['hamstrings'],
  prescription: { sets: 4, reps: '10-15', rir: 'RIR 1-2', rest: '2分', restSeconds: 120 }
      },
      {
        id: 'machine-hip-thrust',
        name: 'ヒップスラストマシン',
        primaryMuscles: ['glutes'],
  prescription: { sets: 3, reps: '8-12', rir: 'RIR 1-2', rest: '3分', restSeconds: 180 }
      },
      {
        id: 'machine-adductor',
        name: 'アダクターマシン',
        primaryMuscles: ['adductors'],
  prescription: { sets: 3, reps: '12-15', rir: 'RIR 1', rest: '90秒', restSeconds: 90 }
      },
      {
        id: 'machine-abductor',
        name: 'アブダクターマシン',
        primaryMuscles: ['abductors'],
  prescription: { sets: 3, reps: '12-15', rir: 'RIR 1', rest: '90秒', restSeconds: 90 }
      },
      {
        id: 'machine-standing-calf',
        name: 'スタンディングカーフレイズ',
        primaryMuscles: ['calves'],
  prescription: { sets: 4, reps: '10-15', rir: 'RIR 1-2', rest: '90秒', restSeconds: 90 }
      }
    ]
  }
];

const EXPERIENCE_VOLUME_MODIFIER: Record<TrainingPreferences['experienceLevel'], number> = {
  beginner: 0.75,
  intermediate: 1,
  advanced: 1.15
};

export const buildPlan = (preferences: TrainingPreferences): WeeklyPlan => {
  const baseVolume = 16;
  const volumeTarget = Math.round(baseVolume * EXPERIENCE_VOLUME_MODIFIER[preferences.experienceLevel]);

  const sessions = BASE_PLAN.slice(0, Math.min(preferences.availableDays, 4)).map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      prescription: { ...exercise.prescription }
    }))
  }));

  const recommendations: string[] = [
    '各セットのRIRは1〜3を維持して過度な疲労を避けましょう。',
    '週4〜6週後にデロード週を挟み、セット数または強度を抑えて回復させます。',
    'レップ上限に達したエクササイズは次回重量を最小単位だけ増やし、再びダブルプログレッションを繰り返します。'
  ];

  if (preferences.focusArea === 'upper-priority') {
    recommendations.push('上半身重点の場合はプル系のアクセントセットを追加し、下半身は最低限のボリュームを維持。');
  }

  if (preferences.focusArea === 'lower-priority') {
    recommendations.push('下半身重点の場合はレッグプレスやヒップスラストを追加1セット実施。');
  }

  if (!preferences.includeIsolation) {
    sessions.forEach((session, index) => {
      sessions[index] = {
        ...session,
        exercises: session.exercises.filter((exercise) => exercise.primaryMuscles.length > 1)
      };
    });
  }

  return {
    split: 'upper-lower',
    totalVolumeTargetPerMuscle: volumeTarget,
    sessions,
    recommendations
  };
};
