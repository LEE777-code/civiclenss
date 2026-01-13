import { Capacitor } from '@capacitor/core';
import { getCurrentUserId } from './authService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://civiclens-r87i.onrender.com';
const FCM_TOKEN_KEY = 'civic_lens_fcm_token';

/**
 * Silently saves the FCM token to backend and local storage
 * This happens automatically without any user interaction
 */
export const saveFCMToken = async (token: string): Promise<void> => {
    try {
        // Save token to local storage for offline access
        localStorage.setItem(FCM_TOKEN_KEY, token);

        const userId = getCurrentUserId();

        // Only send to backend if user is authenticated
        if (!userId) {
            console.log('📱 FCM token saved locally, will sync when user logs in');
            return;
        }

        // Get device information
        const platform = Capacitor.getPlatform(); // 'android', 'ios', or 'web'
        const deviceInfo = {
            platform,
            appVersion: '1.0.0', // You can get this from your app config
            timestamp: new Date().toISOString(),
        };

        // Send token to backend silently
        const response = await fetch(`${BACKEND_URL}/api/notifications/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                fcmToken: token,
                ...deviceInfo,
            }),
        });

        if (response.ok) {
            console.log('✅ FCM token registered with backend');
        } else {
            console.warn('⚠️ Failed to register FCM token with backend, will retry later');
        }
    } catch (error) {
        // Silently handle errors - don't show anything to user
        console.warn('⚠️ Error saving FCM token:', error);
    }
};

/**
 * Get the stored FCM token from local storage
 */
export const getStoredFCMToken = (): string | null => {
    return localStorage.getItem(FCM_TOKEN_KEY);
};

/**
 * Sync FCM token with backend (call this after login)
 */
export const syncFCMTokenAfterLogin = async (): Promise<void> => {
    const token = getStoredFCMToken();
    if (token) {
        await saveFCMToken(token);
    }
};

/**
 * Remove FCM token from backend on logout
 */
export const removeFCMToken = async (): Promise<void> => {
    try {
        const token = getStoredFCMToken();
        const userId = getCurrentUserId();

        if (!token || !userId) return;

        await fetch(`${BACKEND_URL}/api/notifications/unregister`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                fcmToken: token,
            }),
        });

        localStorage.removeItem(FCM_TOKEN_KEY);
    } catch (error) {
        console.warn('⚠️ Error removing FCM token:', error);
    }
};
