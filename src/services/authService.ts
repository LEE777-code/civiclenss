// Authentication service for managing login persistence
const AUTH_STORAGE_KEY = 'civic_lens_auth';
const ONBOARDING_COMPLETED_KEY = 'civic_lens_onboarding_completed';

interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    lastLogin: number;
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    try {
        const authState = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!authState) return false;

        const parsed: AuthState = JSON.parse(authState);
        return parsed.isAuthenticated;
    } catch (error) {
        console.error('Error checking auth state:', error);
        return false;
    }
};

// Get current user ID
export const getCurrentUserId = (): string | null => {
    try {
        const authState = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!authState) return null;

        const parsed: AuthState = JSON.parse(authState);
        return parsed.userId;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
};

// Set authentication state (called after successful login/signup)
export const setAuthState = (userId: string): void => {
    const authState: AuthState = {
        isAuthenticated: true,
        userId,
        lastLogin: Date.now(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

// Clear authentication state (called on logout)
export const clearAuthState = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
};

// Check if onboarding has been completed
export const hasCompletedOnboarding = (): boolean => {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
};

// Mark onboarding as completed
export const setOnboardingCompleted = (): void => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
};
