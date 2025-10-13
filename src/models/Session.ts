export interface Session {
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    exercises: Array<{
        exerciseName: string;
        sets: number;
        reps: number;
        weight: number;
    }>;
}