export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
}

export interface Session {
    id: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface TrainingMenu {
    id: string;
    userId: string;
    exercises: Exercise[];
    createdAt: Date;
}

export interface Exercise {
    name: string;
    sets: number;
    reps: number;
    weight: number;
}