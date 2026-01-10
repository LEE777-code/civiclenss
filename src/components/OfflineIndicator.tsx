import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getLastSyncTime } from '@/services/offlineService';

const OfflineIndicator = () => {
    const isOnline = useOnlineStatus();
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [showOnlineNotification, setShowOnlineNotification] = useState(false);

    useEffect(() => {
        const fetchLastSync = async () => {
            const syncTime = await getLastSyncTime();
            setLastSync(syncTime);
        };
        fetchLastSync();
    }, [isOnline]);

    useEffect(() => {
        if (isOnline) {
            setShowOnlineNotification(true);
            const timer = setTimeout(() => setShowOnlineNotification(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    const formatLastSync = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Show online notification briefly
    if (isOnline && showOnlineNotification) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white px-4 py-2 flex items-center justify-center gap-2 animate-fade-in">
                <Wifi size={16} />
                <span className="text-sm font-medium">Back online</span>
            </div>
        );
    }

    // Show offline banner
    if (!isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-md">
                <WifiOff size={16} />
                <span className="text-sm font-medium">
                    Offline mode
                    {lastSync && ` • Last synced ${formatLastSync(lastSync)}`}
                </span>
            </div>
        );
    }

    return null;
};

export default OfflineIndicator;
