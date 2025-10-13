export const validateUserInput = (input: any): boolean => {
    // Add validation logic for user input
    return true; // Placeholder return value
};

export const validateTrainingData = (data: any): boolean => {
    // Add validation logic for training data
    return true; // Placeholder return value
};

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isNonEmptyString = (str: string): boolean => {
    return typeof str === 'string' && str.trim().length > 0;
};