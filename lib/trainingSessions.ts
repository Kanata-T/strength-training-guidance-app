import type { SupabaseClient } from '@supabase/supabase-js';
import { BASE_PLAN, type Session as TemplateSession, type SetPrescription } from './trainingPlan';

const SESSION_SEQUENCE = ['A', 'B', 'C', 'D'] as const;

export type TemplateCode = (typeof SESSION_SEQUENCE)[number];

export type TrainingSession = {
  id: string;
  template_code: TemplateCode;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: 'planned' | 'in-progress' | 'completed';
  notes: string | null;
};

export type TrainingSessionSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  target_reps: string;
  target_rir: string;
  rest_seconds: number;
  rest_seconds_min: number | null;
  rest_seconds_max: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rir_min: number | null;
  target_rir_max: number | null;
  recommended_weight: number | null;
  progression_goal: string | null;
  progression_notes: string | null;
  performed_reps: number | null;
  performed_rir: number | null;
  weight: number | null;
  logged_at: string | null;
  notes: string | null;
};

export type PreviousSessionSummary = {
  session: TrainingSession;
  sets: TrainingSessionSet[];
};

export type UpcomingSessionPayload = {
  session: TrainingSession;
  sets: TrainingSessionSet[];
  template: TemplateSession;
  previousSession?: PreviousSessionSummary | null;
};

export type SessionProgressSummary = {
  session: TrainingSession;
  totalSets: number;
  loggedSets: number;
  totalVolume: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericSupabase = SupabaseClient<any, 'public'>;

type TemplateLookup = Record<TemplateCode, TemplateSession>;

const templateByCode: TemplateLookup = BASE_PLAN.reduce((acc, session) => {
  acc[session.id as TemplateCode] = session;
  return acc;
}, {} as TemplateLookup);

const parseRange = (value: string) => {
  const match = value.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) {
    return { min: null as number | null, max: null as number | null };
  }
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  return { min, max };
};

const normalizePrescription = (prescription: SetPrescription) => {
  const reps = {
    min: prescription.repsMin ?? parseRange(prescription.reps).min,
    max: prescription.repsMax ?? parseRange(prescription.reps).max
  };
  const rir = {
    min: prescription.rirMin ?? parseRange(prescription.rir).min,
    max: prescription.rirMax ?? parseRange(prescription.rir).max
  };
  const rest = {
    min: prescription.restSecondsMin ?? prescription.restSeconds,
    max: prescription.restSecondsMax ?? prescription.restSeconds
  };

  return {
    repsMin: reps.min,
    repsMax: reps.max,
    rirMin: rir.min,
    rirMax: rir.max,
    restSecondsMin: rest.min,
    restSecondsMax: rest.max
  } as const;
};

const todayDate = () => new Date().toISOString().split('T')[0];

const nextTemplateCode = (lastCode?: string | null): TemplateCode => {
  if (!lastCode) {
    return SESSION_SEQUENCE[0];
  }

  const index = SESSION_SEQUENCE.indexOf(lastCode as TemplateCode);
  if (index === -1 || index === SESSION_SEQUENCE.length - 1) {
    return SESSION_SEQUENCE[0];
  }

  return SESSION_SEQUENCE[index + 1];
};

const fetchSessionSets = async (client: GenericSupabase, sessionId: string) => {
  const { data, error } = await client
    .from('training_session_sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('exercise_order', { ascending: true })
    .order('set_number', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as TrainingSessionSet[];
};

const fetchPreviousCompleted = async (client: GenericSupabase, userId: string) => {
  const { data: session, error } = await client
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!session) {
    return null;
  }

  const sets = await fetchSessionSets(client, session.id);
  return { session: session as TrainingSession, sets } satisfies PreviousSessionSummary;
};

const buildSetRowsFromTemplate = (sessionId: string, template: TemplateSession) => {
  return template.exercises.flatMap((exercise, exerciseIndex) => {
    const normalized = normalizePrescription(exercise.prescription);
    return Array.from({ length: exercise.prescription.sets }).map((_, idx) => ({
      session_id: sessionId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_order: exerciseIndex,
      set_number: idx + 1,
      target_reps: exercise.prescription.reps,
      target_reps_min: normalized.repsMin,
      target_reps_max: normalized.repsMax,
      target_rir: exercise.prescription.rir,
      target_rir_min: normalized.rirMin,
      target_rir_max: normalized.rirMax,
      rest_seconds: exercise.prescription.restSeconds,
      rest_seconds_min: normalized.restSecondsMin ?? null,
      rest_seconds_max: normalized.restSecondsMax ?? null,
      recommended_weight: null,
      progression_goal: null,
      progression_notes: null,
      notes: null
    }));
  });
};

const ensureSessionSetsForTemplate = async (
  client: GenericSupabase,
  session: TrainingSession,
  template: TemplateSession
) => {
  const existingSets = await fetchSessionSets(client, session.id);
  if (existingSets.length > 0) {
    return existingSets;
  }

  const setRows = buildSetRowsFromTemplate(session.id, template);
  if (setRows.length === 0) {
    return existingSets;
  }

  const { error } = await client.from('training_session_sets').insert(setRows);
  if (error) {
    throw new Error(error.message);
  }

  return fetchSessionSets(client, session.id);
};

const createSessionFromTemplate = async (
  client: GenericSupabase,
  userId: string,
  templateCode: TemplateCode,
  previousSession?: PreviousSessionSummary | null
) => {
  const template = templateByCode[templateCode];

  const { data: inserted, error } = await client
    .from('training_sessions')
    .insert({
      user_id: userId,
      template_code: templateCode,
      scheduled_date: todayDate(),
      status: 'planned'
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const session = inserted as TrainingSession;

  const setRows = buildSetRowsFromTemplate(session.id, template);

  if (setRows.length > 0) {
    const { error: setsError } = await client.from('training_session_sets').insert(setRows);
    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  let sets = await fetchSessionSets(client, session.id);
  const progressionApplied = await applyProgressionToSessionSets(client, userId, session, template, sets);
  if (progressionApplied) {
    sets = await fetchSessionSets(client, session.id);
  }

  return { session, sets, template, previousSession } satisfies UpcomingSessionPayload;
};

const determineTemplateForNewSession = async (client: GenericSupabase, userId: string) => {
  const { data: lastCompleted, error } = await client
    .from('training_sessions')
    .select('template_code')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return nextTemplateCode(lastCompleted?.template_code ?? null);
};

export const ensureUpcomingSession = async (client: GenericSupabase, forceTemplateCode?: TemplateCode): Promise<UpcomingSessionPayload> => {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('ユーザーが認証されていません。');
  }

  const { data: inProgress, error: inProgressError } = await client
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in-progress')
    .order('started_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (inProgressError) {
    throw new Error(inProgressError.message);
  }

  if (inProgress) {
    const template = templateByCode[inProgress.template_code as TemplateCode];
    const sets = await ensureSessionSetsForTemplate(client, inProgress as TrainingSession, template);
    const previousSession = await fetchPreviousCompleted(client, userId);
    return {
      session: inProgress as TrainingSession,
      sets,
      template,
      previousSession
    } satisfies UpcomingSessionPayload;
  }

  const { data: planned, error: plannedError } = await client
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'planned')
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (plannedError) {
    throw new Error(plannedError.message);
  }

  const previousSession = await fetchPreviousCompleted(client, userId);

  if (planned) {
    const template = templateByCode[planned.template_code as TemplateCode];
    let sets = await ensureSessionSetsForTemplate(client, planned as TrainingSession, template);
    const progressionApplied = await applyProgressionToSessionSets(
      client,
      userId,
      planned as TrainingSession,
      template,
      sets
    );
    if (progressionApplied) {
      sets = await fetchSessionSets(client, (planned as TrainingSession).id);
    }
    return {
      session: planned as TrainingSession,
      sets,
      template,
      previousSession
    } satisfies UpcomingSessionPayload;
  }

  const templateCode = forceTemplateCode ?? await determineTemplateForNewSession(client, userId);
  return createSessionFromTemplate(client, userId, templateCode, previousSession);
};

export const changeWorkoutType = async (client: GenericSupabase, newTemplateCode: TemplateCode): Promise<UpcomingSessionPayload> => {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('ユーザーが認証されていません。');
  }

  // 既存のplannedセッションがあれば削除
  const { error: deleteError } = await client
    .from('training_sessions')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'planned');

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  // 新しいテンプレートでセッションを作成
  const previousSession = await fetchPreviousCompleted(client, userId);
  return createSessionFromTemplate(client, userId, newTemplateCode, previousSession);
};

export const refreshSessionRecommendations = async (
  client: GenericSupabase,
  sessionId: string
): Promise<TrainingSessionSet[]> => {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('ユーザーが認証されていません。');
  }

  const { data: sessionData, error: sessionError } = await client
    .from('training_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!sessionData) {
    throw new Error('対象のセッションが見つかりません。');
  }

  const session = sessionData as TrainingSession;
  const template = templateByCode[session.template_code as TemplateCode];
  const currentSets = await fetchSessionSets(client, sessionId);
  const applied = await applyProgressionToSessionSets(client, userId, session, template, currentSets);

  if (applied) {
    return fetchSessionSets(client, sessionId);
  }

  return currentSets;
};

export const fetchProgressSummaries = async (client: GenericSupabase, limit = 6): Promise<SessionProgressSummary[]> => {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('ユーザーが認証されていません。');
  }

  const { data: sessions, error } = await client
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  const summaries = await Promise.all(
    sessions.map(async (sessionRecord) => {
      const session = sessionRecord as TrainingSession;
      const sets = await fetchSessionSets(client, session.id);
      const totalSets = sets.length;
      const loggedSets = sets.filter((set) => set.performed_reps !== null).length;
      const totalVolume = sets.reduce((sum, set) => {
        if (set.performed_reps !== null && set.weight !== null) {
          return sum + Number(set.weight) * set.performed_reps;
        }
        return sum;
      }, 0);

      return {
        session,
        totalSets,
        loggedSets,
        totalVolume
      } satisfies SessionProgressSummary;
    })
  );

  return summaries;
};

export const startSession = async (client: GenericSupabase, sessionId: string) => {
  const { error } = await client
    .from('training_sessions')
    .update({ status: 'in-progress', started_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    throw new Error(error.message);
  }
};

export const logSessionSet = async (
  client: GenericSupabase,
  setId: string,
  payload: { performed_reps: number; performed_rir: number; weight?: number | null; notes?: string | null }
) => {
  const { error } = await client
    .from('training_session_sets')
    .update({
      performed_reps: payload.performed_reps,
      performed_rir: payload.performed_rir,
      weight: payload.weight ?? null,
      notes: payload.notes ?? null,
      logged_at: new Date().toISOString()
    })
    .eq('id', setId);

  if (error) {
    throw new Error(error.message);
  }
};

export const completeSession = async (client: GenericSupabase, sessionId: string) => {
  const { error } = await client
    .from('training_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    throw new Error(error.message);
  }
};

export const forceCompleteSession = async (
  client: GenericSupabase,
  sessionId: string,
  note?: string | null
) => {
  const updates: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString()
  };

  if (note != null) {
    updates.notes = note;
  }

  const { error } = await client
    .from('training_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    throw new Error(error.message);
  }
};

export const fetchSessionSetsByIds = async (client: GenericSupabase, sessionId: string) => {
  return fetchSessionSets(client, sessionId);
};

export type ExerciseSetHistory = {
  sessionId: string;
  sessionCompletedAt: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: number | null;
  performedReps: number | null;
  performedRir: number | null;
};

export const fetchExerciseSetHistory = async (client: GenericSupabase): Promise<ExerciseSetHistory[]> => {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('ユーザーが認証されていません。');
  }

  const { data: sessions, error } = await client
    .from('training_sessions')
    .select('id, completed_at, status, training_session_sets(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  const history: ExerciseSetHistory[] = [];

  for (const sessionRecord of sessions as Array<TrainingSession & { training_session_sets: TrainingSessionSet[] | null }>) {
    if (!sessionRecord.completed_at) {
      continue;
    }

    const sessionSets = sessionRecord.training_session_sets ?? [];
    for (const set of sessionSets) {
      history.push({
        sessionId: sessionRecord.id,
        sessionCompletedAt: sessionRecord.completed_at,
        exerciseId: set.exercise_id,
        exerciseName: set.exercise_name,
        setNumber: set.set_number,
        weight: set.weight,
        performedReps: set.performed_reps,
        performedRir: set.performed_rir
      });
    }
  }

  return history;
};

type ExerciseMetadata = {
  id: string;
  category: string | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rir_min: number | null;
  target_rir_max: number | null;
};

type ExerciseExposure = {
  sessionId: string;
  completedAt: string;
  sets: TrainingSessionSet[];
};

type ProgressionStage = 'week1' | 'week2' | 'week3' | 'deload';

type ExposureClassification = 'increase_weight' | 'add_reps' | 'struggle' | 'deload' | 'no_data';

type ExposureStats = {
  avgRir: number | null;
  minRir: number | null;
  maxRir: number | null;
  avgReps: number | null;
  minReps: number | null;
  maxReps: number | null;
  allAtMaxReps: boolean;
  setsWithData: number;
  maxWeight: number | null;
};

type ComputedPlan = {
  targetRirMin: number;
  targetRirMax: number;
  targetRirText: string;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRepsText: string;
  recommendedWeight: number | null;
  goal: string;
  notes?: string | null;
};

const STAGE_SEQUENCE: ProgressionStage[] = ['week1', 'week2', 'week3', 'deload'];

const STAGE_TARGETS: Record<ProgressionStage, { rirMin: number; rirMax: number }> = {
  week1: { rirMin: 3, rirMax: 3 },
  week2: { rirMin: 2, rirMax: 2 },
  week3: { rirMin: 1, rirMax: 1 },
  deload: { rirMin: 4, rirMax: 5 }
};

const STAGE_LABELS: Record<ProgressionStage, string> = {
  week1: 'Week1',
  week2: 'Week2',
  week3: 'Week3',
  deload: 'Deload'
};

const COMPOUND_CATEGORIES = new Set(['lower-compound', 'upper-pull', 'upper-push']);

const WEIGHT_INCREMENT: Record<'compound' | 'accessory', number> = {
  compound: 2.5,
  accessory: 1.25
};

async function applyProgressionToSessionSets(
  client: GenericSupabase,
  userId: string,
  session: TrainingSession,
  template: TemplateSession,
  currentSets: TrainingSessionSet[]
): Promise<boolean> {
  if (session.status !== 'planned') {
    return false;
  }

  if (currentSets.length === 0) {
    return false;
  }

  const exerciseIds = Array.from(new Set(currentSets.map((set) => set.exercise_id)));
  if (exerciseIds.length === 0) {
    return false;
  }

  const [metadataMap, exposureMap] = await Promise.all([
    fetchExerciseMetadataMap(client, exerciseIds),
    fetchExerciseExposureMap(client, userId, exerciseIds)
  ]);

  let applied = false;

  for (const exercise of template.exercises) {
    const plannedSets = currentSets
      .filter((set) => set.exercise_id === exercise.id)
      .sort((a, b) => a.set_number - b.set_number);

    if (plannedSets.length === 0) {
      continue;
    }

    const metadata = metadataMap.get(exercise.id) ?? null;
    const exposures = exposureMap.get(exercise.id) ?? [];

    const plan = computeProgressionPlan(exercise, plannedSets, metadata, exposures);

    if (!plan) {
      continue;
    }

    const sample = plannedSets[0];
    const requiresUpdate =
      (sample.target_rir_min ?? null) !== plan.targetRirMin ||
      (sample.target_rir_max ?? null) !== plan.targetRirMax ||
      (sample.target_reps_min ?? null) !== plan.targetRepsMin ||
      (sample.target_reps_max ?? null) !== plan.targetRepsMax ||
      sample.target_rir !== plan.targetRirText ||
      sample.target_reps !== plan.targetRepsText ||
      (sample.recommended_weight ?? null) !== (plan.recommendedWeight ?? null) ||
      sample.progression_goal !== plan.goal ||
      (sample.progression_notes ?? null) !== (plan.notes ?? null);

    if (!requiresUpdate) {
      continue;
    }

    const { error } = await client
      .from('training_session_sets')
      .update({
        target_rir_min: plan.targetRirMin,
        target_rir_max: plan.targetRirMax,
        target_rir: plan.targetRirText,
        target_reps_min: plan.targetRepsMin,
        target_reps_max: plan.targetRepsMax,
        target_reps: plan.targetRepsText,
        recommended_weight: plan.recommendedWeight,
        progression_goal: plan.goal,
        progression_notes: plan.notes ?? null
      })
      .in('id', plannedSets.map((set) => set.id));

    if (error) {
      throw new Error(error.message);
    }

    applied = true;
  }

  return applied;
}

async function fetchExerciseMetadataMap(
  client: GenericSupabase,
  exerciseIds: string[]
): Promise<Map<string, ExerciseMetadata>> {
  if (exerciseIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from('training_exercises')
    .select('id, category, target_reps_min, target_reps_max, target_rir_min, target_rir_max')
    .in('id', exerciseIds);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, ExerciseMetadata>();
  (data ?? []).forEach((row) => {
    map.set(row.id, row as ExerciseMetadata);
  });

  return map;
}

async function fetchExerciseExposureMap(
  client: GenericSupabase,
  userId: string,
  exerciseIds: string[],
  sessionLimit = 20,
  exposuresPerExercise = 8
): Promise<Map<string, ExerciseExposure[]>> {
  const map = new Map<string, ExerciseExposure[]>();

  if (exerciseIds.length === 0) {
    return map;
  }

  const { data, error } = await client
    .from('training_sessions')
    .select('id, completed_at, status, training_session_sets(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(sessionLimit);

  if (error) {
    throw new Error(error.message);
  }

  for (const sessionRecord of (data ?? []) as Array<TrainingSession & { training_session_sets: TrainingSessionSet[] | null }>) {
    if (!sessionRecord.completed_at) {
      continue;
    }

    const group = new Map<string, TrainingSessionSet[]>();
    const sets = sessionRecord.training_session_sets ?? [];

    for (const set of sets) {
      if (!exerciseIds.includes(set.exercise_id)) {
        continue;
      }
      if (!group.has(set.exercise_id)) {
        group.set(set.exercise_id, []);
      }
      group.get(set.exercise_id)?.push(set);
    }

    for (const [exerciseId, setsForExercise] of group.entries()) {
      const sortedSets = setsForExercise.sort((a, b) => a.set_number - b.set_number);
      const exposures = map.get(exerciseId) ?? [];
      if (exposures.length >= exposuresPerExercise) {
        continue;
      }
      exposures.push({
        sessionId: sessionRecord.id,
        completedAt: sessionRecord.completed_at,
        sets: sortedSets
      });
      map.set(exerciseId, exposures);
    }
  }

  return map;
}

function computeProgressionPlan(
  exercise: TemplateSession['exercises'][number],
  plannedSets: TrainingSessionSet[],
  metadata: ExerciseMetadata | null,
  exposures: ExerciseExposure[]
): ComputedPlan | null {
  const category = classifyExerciseCategory(metadata?.category);
  const baseRepsMin = exercise.prescription.repsMin;
  const baseRepsMax = exercise.prescription.repsMax;

  const lastExposure = exposures[0] ?? null;
  const prevExposure = exposures[1] ?? null;

  const lastStage = lastExposure ? inferStageFromExposure(lastExposure) : null;
  let upcomingStage = nextStage(lastStage);

  const lastEvaluation = lastExposure
    ? evaluateExposure(lastExposure, lastStage ?? defaultStageForCategory(), category, exercise)
    : null;

  const prevStage = prevExposure
    ? inferStageFromExposure(prevExposure) ?? (lastStage ? previousStage(lastStage) : defaultStageForCategory())
    : null;

  const prevEvaluation = prevExposure && prevStage
    ? evaluateExposure(prevExposure, prevStage, category, exercise)
    : null;

  const stallDetected =
    lastEvaluation?.classification === 'struggle' && prevEvaluation?.classification === 'struggle';

  if (stallDetected && upcomingStage !== 'deload') {
    upcomingStage = 'deload';
  }

  const stageTargets = STAGE_TARGETS[upcomingStage];

  let targetRepsMin = baseRepsMin;
  let targetRepsMax = baseRepsMax;

  if (upcomingStage === 'deload') {
    targetRepsMin = Math.max(1, Math.round(baseRepsMin * 0.6));
    targetRepsMax = Math.max(targetRepsMin, Math.round(baseRepsMax * 0.6));
  }

  const targetRepsText = formatRangeText(targetRepsMin, targetRepsMax);
  const targetRirText = formatRirText(stageTargets.rirMin, stageTargets.rirMax);

  const classificationForGoal = lastEvaluation?.classification ?? 'no_data';
  const statsForGoal = lastEvaluation?.stats ?? null;
  const baseWeight = statsForGoal?.maxWeight ?? null;
  const recommendedWeight = computeRecommendedWeight({
    category,
    upcomingStage,
    classification: classificationForGoal,
    baseWeight
  });

  const goal = buildGoalMessage({
    category,
    upcomingStage,
    classification: classificationForGoal,
    targetRepsLabel: formatRepsLabel(targetRepsMin, targetRepsMax),
    targetRirLabel: formatRirLabel(stageTargets.rirMin, stageTargets.rirMax),
    stallDetected,
    recommendedWeight,
    baseWeight
  });

  const notes = buildProgressionNotes({
    upcomingStage,
    targetRepsLabel: formatRepsLabel(targetRepsMin, targetRepsMax),
    targetRirLabel: formatRirLabel(stageTargets.rirMin, stageTargets.rirMax),
    stats: statsForGoal,
    stallDetected,
    recommendedWeight,
    baseWeight
  });

  return {
    targetRirMin: stageTargets.rirMin,
    targetRirMax: stageTargets.rirMax,
    targetRirText,
    targetRepsMin,
    targetRepsMax,
    targetRepsText,
    recommendedWeight,
    goal,
    notes
  } satisfies ComputedPlan;
}

function defaultStageForCategory(): ProgressionStage {
  return 'week1';
}

function classifyExerciseCategory(category?: string | null): 'compound' | 'accessory' {
  if (category && COMPOUND_CATEGORIES.has(category)) {
    return 'compound';
  }
  return 'accessory';
}

function inferStageFromExposure(exposure: ExerciseExposure): ProgressionStage | null {
  for (const set of exposure.sets) {
    const rirCandidates = [set.target_rir_min, set.target_rir_max].filter((value) => value != null) as number[];
    for (const rir of rirCandidates) {
      if (rir >= 4) {
        return 'deload';
      }
      if (rir <= 1) {
        return 'week3';
      }
      if (rir === 2) {
        return 'week2';
      }
      if (rir === 3) {
        return 'week1';
      }
    }
    if ((set.progression_goal ?? '').includes('ディロード') || (set.progression_goal ?? '').toLowerCase().includes('deload')) {
      return 'deload';
    }
  }
  return null;
}

function nextStage(stage: ProgressionStage | null): ProgressionStage {
  if (!stage) {
    return 'week1';
  }
  const index = STAGE_SEQUENCE.indexOf(stage);
  if (index === -1 || index === STAGE_SEQUENCE.length - 1) {
    return 'week1';
  }
  return STAGE_SEQUENCE[index + 1];
}

function previousStage(stage: ProgressionStage): ProgressionStage {
  const index = STAGE_SEQUENCE.indexOf(stage);
  if (index <= 0) {
    return 'deload';
  }
  return STAGE_SEQUENCE[index - 1];
}

function evaluateExposure(
  exposure: ExerciseExposure,
  stage: ProgressionStage,
  category: 'compound' | 'accessory',
  exercise: TemplateSession['exercises'][number]
): { classification: ExposureClassification; stats: ExposureStats } {
  const stats = computeExposureStats(exposure, exercise);

  if (stage === 'deload') {
    return { classification: 'deload', stats };
  }

  if (stats.setsWithData === 0) {
    return { classification: 'no_data', stats };
  }

  const targetRir = STAGE_TARGETS[stage].rirMin;
  const tolerance = 0.5;

  if (category === 'compound') {
    if (stats.avgRir !== null && stats.avgRir > targetRir + tolerance) {
      return { classification: 'increase_weight', stats };
    }
    if ((stats.avgRir !== null && Math.abs(stats.avgRir - targetRir) <= tolerance) || stats.avgRir === null) {
      return { classification: 'add_reps', stats };
    }
    if (
      (stats.minRir !== null && stats.minRir < targetRir - tolerance) ||
      (stats.minReps !== null && stats.minReps < exercise.prescription.repsMin)
    ) {
      return { classification: 'struggle', stats };
    }
    return { classification: 'add_reps', stats };
  }

  // accessory / isolation logic
  if (
    stats.allAtMaxReps &&
    stats.avgRir !== null &&
    stats.avgRir <= targetRir + tolerance
  ) {
    return { classification: 'increase_weight', stats };
  }

  if (
    (stats.minReps !== null && stats.minReps < exercise.prescription.repsMin) ||
    (stats.minRir !== null && stats.minRir < targetRir - tolerance)
  ) {
    return { classification: 'struggle', stats };
  }

  return { classification: 'add_reps', stats };
}

function computeExposureStats(
  exposure: ExerciseExposure,
  exercise: TemplateSession['exercises'][number]
): ExposureStats {
  const reps: number[] = [];
  const rirs: number[] = [];
  let maxWeight: number | null = null;

  for (const set of exposure.sets) {
    if (set.performed_reps != null) {
      reps.push(set.performed_reps);
    }
    if (set.performed_rir != null) {
      rirs.push(set.performed_rir);
    }
    if (set.weight != null) {
      const numericWeight = typeof set.weight === 'number' ? set.weight : Number(set.weight);
      if (!Number.isNaN(numericWeight)) {
        maxWeight = maxWeight == null ? numericWeight : Math.max(maxWeight, numericWeight);
      }
    }
  }

  const avg = (values: number[]) => (values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  const min = (values: number[]) => (values.length > 0 ? Math.min(...values) : null);
  const max = (values: number[]) => (values.length > 0 ? Math.max(...values) : null);

  const avgReps = avg(reps);
  const minReps = min(reps);
  const maxReps = max(reps);
  const avgRir = avg(rirs);
  const minRir = min(rirs);
  const maxRir = max(rirs);

  const allAtMaxReps = reps.length > 0 && reps.every((value) => value >= exercise.prescription.repsMax);

  return {
    avgRir,
    minRir,
    maxRir,
    avgReps,
    minReps,
    maxReps,
    allAtMaxReps,
    setsWithData: Math.max(reps.length, rirs.length),
    maxWeight
  } satisfies ExposureStats;
}

function computeRecommendedWeight(params: {
  category: 'compound' | 'accessory';
  upcomingStage: ProgressionStage;
  classification: ExposureClassification;
  baseWeight: number | null;
}): number | null {
  const { category, upcomingStage, classification, baseWeight } = params;

  if (baseWeight == null) {
    return null;
  }

  const increment = WEIGHT_INCREMENT[category];
  const round = (value: number) => Math.max(0, Number((Math.round(value / increment) * increment).toFixed(2)));

  if (upcomingStage === 'deload') {
    return round(baseWeight * 0.75);
  }

  switch (classification) {
    case 'increase_weight':
      return round(baseWeight + increment);
    case 'struggle':
      return round(baseWeight * 0.95);
    case 'add_reps':
    case 'deload':
    case 'no_data':
    default:
      return round(baseWeight);
  }
}

function buildGoalMessage(params: {
  category: 'compound' | 'accessory';
  upcomingStage: ProgressionStage;
  classification: ExposureClassification;
  targetRepsLabel: string;
  targetRirLabel: string;
  stallDetected: boolean;
  recommendedWeight: number | null;
  baseWeight: number | null;
}): string {
  const {
    category,
    upcomingStage,
    classification,
    targetRepsLabel,
    targetRirLabel,
    stallDetected,
    recommendedWeight,
    baseWeight
  } = params;

  const formatWeight = (weight: number | null) => (weight != null ? `${weight.toFixed(1)}kg` : baseWeight != null ? `${baseWeight.toFixed(1)}kg` : '現在の重量');

  if (upcomingStage === 'deload') {
    return `${stallDetected ? '停滞解消' : '計画'}ディロード：${formatWeight(recommendedWeight)}を目安に${targetRepsLabel}・${targetRirLabel}で回復を優先。セット数は半分に減らしましょう。`;
  }

  if (classification === 'no_data') {
    return `初回: ${targetRepsLabel}・${targetRirLabel}を守り、フォーム習得と記録に集中してください。`;
  }

  if (classification === 'increase_weight') {
    const formatted = formatWeight(recommendedWeight);
    if (category === 'compound') {
      return `${formatted}で${targetRepsLabel}・${targetRirLabel}に挑戦し、重量を伸ばしましょう。`;
    }
    return `全セット上限を達成。${formatted}まで増量してレンジ下限から${targetRirLabel}で積み上げましょう。`;
  }

  if (classification === 'add_reps') {
    if (category === 'compound') {
      return `${formatWeight(recommendedWeight)}を維持しつつ各セット+1レップ、${targetRirLabel}に揃えてください。`;
    }
    return `${formatWeight(recommendedWeight)}を維持し、${targetRepsLabel}上限を目指して${targetRirLabel}を守りつつレップを積み上げましょう。`;
  }

  if (classification === 'struggle') {
    return `前回は目標未達。フォームと可動域を優先し、必要なら${formatWeight(recommendedWeight)}まで軽くして${targetRirLabel}を守りましょう。`;
  }

  if (classification === 'deload') {
    return `${targetRirLabel}を確保しながら回復に専念しましょう。`;
  }

  return `記録を参考に${targetRepsLabel}・${targetRirLabel}で継続してください。`;
}

function buildProgressionNotes(params: {
  upcomingStage: ProgressionStage;
  targetRepsLabel: string;
  targetRirLabel: string;
  stats: ExposureStats | null;
  stallDetected: boolean;
  recommendedWeight: number | null;
  baseWeight: number | null;
}): string | null {
  const { upcomingStage, targetRepsLabel, targetRirLabel, stats, stallDetected, recommendedWeight, baseWeight } = params;
  const notes: string[] = [];

  notes.push(`フェーズ: ${STAGE_LABELS[upcomingStage]}`);
  notes.push(`目標: ${targetRepsLabel} / ${targetRirLabel}`);

  if (stats?.maxWeight != null) {
    notes.push(`前回最大重量: ${stats.maxWeight.toFixed(1)}kg`);
  }

  if (recommendedWeight != null) {
    notes.push(`推奨重量: ${recommendedWeight.toFixed(1)}kg`);
  } else if (baseWeight != null) {
    notes.push(`推奨重量: ${baseWeight.toFixed(1)}kg (現状維持)`);
  }

  if (stallDetected) {
    notes.push('2回連続で停滞 -> ディロード推奨');
  }

  return notes.length > 0 ? notes.join(' | ') : null;
}

function formatRangeText(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

function formatRirText(min: number, max: number): string {
  return min === max ? `RIR ${min}` : `RIR ${min}-${max}`;
}

function formatRepsLabel(min: number, max: number): string {
  return min === max ? `${min}レップ` : `${min}-${max}レップ`;
}

function formatRirLabel(min: number, max: number): string {
  return min === max ? `RIR ${min}` : `RIR ${min}-${max}`;
}
