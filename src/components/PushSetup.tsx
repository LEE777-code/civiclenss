import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

/**
 * Silent Push Notification Setup
 * Automatically registers device for push notifications and saves FCM token to Supabase
 * ✅ Works with Clerk authentication
 * Runs completely in the background - no UI (except temporary debug alerts)
 */
function PushSetup() {
    const { isSignedIn, user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Only run on native platforms (Android/iOS)
        if (!Capacitor.isNativePlatform()) {
            console.log('🔴 Not on native platform, skipping FCM setup');
            return;
        }

        // Only proceed if user is signed in with Clerk
        if (!isSignedIn || !user) {
            console.log('🔴 User not signed in, skipping FCM setup');
            return;
        }

        console.log('✅ User signed in via Clerk:', user.id);

        let listeners: any[] = [];

        const registerDeviceToken = async () => {
            try {
                // User is logged in and ready for FCM registration

                console.log('📱 Starting FCM registration for user:', user.id);

                // Check current permission status
                const permStatus = await PushNotifications.checkPermissions();
                console.log('🔐 Push permission status:', permStatus.receive);

                let finalStatus = permStatus.receive;

                // If permission not yet granted, request it
                if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
                    console.log('🔔 Requesting push notification permissions...');
                    const permRequest = await PushNotifications.requestPermissions();
                    finalStatus = permRequest.receive;
                    console.log('🔐 Permission result:', finalStatus);
                }

                // Register for push notifications if not denied
                if (finalStatus !== 'denied') {
                    console.log('✅ Registering for push notifications...');
                    await PushNotifications.register();
                } else {
                    console.log('❌ Push notifications denied by user');
                }
            } catch (error: any) {
                console.error('❌ Error in registerDeviceToken:', error);
            }
        };

        const setupPushNotifications = async () => {
            // Listen for FCM token registration
            const registrationListener = await PushNotifications.addListener(
                'registration',
                async (token) => {
                    try {
                        console.log('🎉 FCM Token received:', token.value);

                        // Upsert FCM token to user_devices table with clerk_id
                        console.log('💾 Saving token to database for clerk_id:', user.id);

                        const { data, error } = await supabase
                            .from('user_devices')
                            .upsert(
                                {
                                    clerk_id: user.id,  // Use Clerk user ID
                                    fcm_token: token.value,
                                    platform: Capacitor.getPlatform(),
                                    notifications_enabled: true, // Enable notifications by default
                                    updated_at: new Date().toISOString()
                                },
                                { onConflict: 'fcm_token' }
                            )
                            .select();

                        if (error) {
                            console.error('❌ Error saving FCM token to database:', error);
                        } else {
                            console.log('✅ FCM token saved to database successfully:', data);
                        }
                    } catch (error: any) {
                        console.error('❌ Error in registration listener:', error);
                    }
                }
            );

            // Handle registration errors
            const errorListener = await PushNotifications.addListener(
                'registrationError',
                (error) => {
                    console.error('❌ Push registration error:', error);
                }
            );

            // Handle incoming notifications when app is open
            const notificationListener = await PushNotifications.addListener(
                'pushNotificationReceived',
                (notification) => {
                    console.log('📬 Notification received:', notification);
                }
            );

            // Handle notification tap/action - navigate to specific report
            const actionListener = await PushNotifications.addListener(
                'pushNotificationActionPerformed',
                (action) => {
                    console.log('👆 Notification action:', action);

                    const data = action.notification.data;
                    console.log('Notification data:', data);

                    // Navigate based on notification data
                    if (data.report_id) {
                        // Navigate to specific report details
                        console.log('Navigating to report:', data.report_id);
                        navigate(`/report-details/${data.report_id}`);
                    } else if (data.type === 'NEARBY_ISSUE') {
                        // Navigate to nearby alerts
                        navigate('/nearby-alerts');
                    } else {
                        // Default to home
                        navigate('/home');
                    }
                }
            );

            listeners = [registrationListener, errorListener, notificationListener, actionListener];

            // ✅ Register token after user is signed in via Clerk
            await registerDeviceToken();
        };

        setupPushNotifications();

        // Cleanup listeners on unmount
        return () => {
            console.log('🧹 Cleaning up FCM listeners');
            listeners.forEach(listener => listener?.remove());
        };
    }, [isSignedIn, user]); // Re-run when auth state changes

    // This component renders nothing - completely invisible
    return null;
}

export default PushSetup;


