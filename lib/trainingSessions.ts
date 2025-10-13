import type { SupabaseClient } from '@supabase/supabase-js';
import { BASE_PLAN, type Session as TemplateSession } from './trainingPlan';

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
    return Array.from({ length: exercise.prescription.sets }).map((_, idx) => ({
      session_id: sessionId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_order: exerciseIndex,
      set_number: idx + 1,
      target_reps: exercise.prescription.reps,
      target_rir: exercise.prescription.rir,
      rest_seconds: exercise.prescription.restSeconds,
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

  const sets = await fetchSessionSets(client, session.id);
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

export const ensureUpcomingSession = async (client: GenericSupabase): Promise<UpcomingSessionPayload> => {
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
    const sets = await ensureSessionSetsForTemplate(client, planned as TrainingSession, template);
    return {
      session: planned as TrainingSession,
      sets,
      template,
      previousSession
    } satisfies UpcomingSessionPayload;
  }

  const templateCode = await determineTemplateForNewSession(client, userId);
  return createSessionFromTemplate(client, userId, templateCode, previousSession);
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
