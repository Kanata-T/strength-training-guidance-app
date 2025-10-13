import { RecommendationService } from '../../src/services/recommendationService';

describe('RecommendationService', () => {
    let recommendationService: RecommendationService;

    beforeEach(() => {
        recommendationService = new RecommendationService();
    });

    it('should provide recommendations based on user input', () => {
        const userInput = { experienceLevel: 'beginner', goals: ['muscle gain'] };
        const recommendations = recommendationService.getRecommendations(userInput);
        
        expect(recommendations).toBeDefined();
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations[0]).toHaveProperty('exercise');
        expect(recommendations[0]).toHaveProperty('sets');
        expect(recommendations[0]).toHaveProperty('reps');
    });

    it('should return an empty array for invalid input', () => {
        const userInput = { experienceLevel: 'unknown', goals: [] };
        const recommendations = recommendationService.getRecommendations(userInput);
        
        expect(recommendations).toEqual([]);
    });

    // Additional tests can be added here
});