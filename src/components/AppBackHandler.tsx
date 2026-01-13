import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Handles Android hardware back button
 * - Goes back if there's navigation history
 * - Exits app only when at root/login screen
 */
const AppBackHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let handler: any;

        const setupListener = async () => {
            handler = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                const currentPath = location.pathname;

                // Define routes where back button should exit the app
                const exitRoutes = ['/', '/login', '/home', '/onboarding'];

                if (canGoBack && !exitRoutes.includes(currentPath)) {
                    // Navigate back in history
                    navigate(-1);
                } else if (exitRoutes.includes(currentPath)) {
                    // Exit app when at main screens
                    CapacitorApp.exitApp();
                } else {
                    // Fallback to home or exit
                    if (canGoBack) {
                        navigate(-1);
                    } else {
                        CapacitorApp.exitApp();
                    }
                }
            });
        };

        setupListener();

        return () => {
            if (handler) {
                handler.remove();
            }
        };
    }, [navigate, location]);

    return null;
};

export default AppBackHandler;
