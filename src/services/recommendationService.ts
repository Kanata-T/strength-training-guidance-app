import { TrainingMethod, UserInput } from '../types';
import { getTrainingMethods } from '../utils/trainingMethods';

export class RecommendationService {
    private trainingMethods: TrainingMethod[];

    constructor() {
        this.trainingMethods = getTrainingMethods();
    }

    public getRecommendations(userInput: UserInput): string[] {
        const recommendations: string[] = [];

        this.trainingMethods.forEach(method => {
            if (this.isSuitable(method, userInput)) {
                recommendations.push(method.description);
            }
        });

        return recommendations;
    }

    private isSuitable(method: TrainingMethod, userInput: UserInput): boolean {
        // Implement logic to determine if the training method is suitable based on user input
        return true; // Placeholder logic
    }
}