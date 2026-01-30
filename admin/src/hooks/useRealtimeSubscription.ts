import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionProps {
  channelName: string;
  table: string;
  schema?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  onChange: (payload: any) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  channelName,
  table,
  schema = 'public',
  event = '*',
  filter,
  onChange,
  enabled = true,
}: UseRealtimeSubscriptionProps) {
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;

    try {
      // Create a unique channel name to avoid conflicts if needed, 
      // or use the provided one to allow shared channels
      const finalChannelName = `${channelName}-${Date.now()}`;
      
      channel = supabase
        .channel(finalChannelName)
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table,
            filter,
          },
          (payload) => {
            console.log(`Real-time update received on ${table}:`, payload);
            onChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${table} changes`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to ${table} changes`);
          } else if (status === 'TIMED_OUT') {
            console.warn(`Subscription to ${table} timed out`);
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channel) {
        console.log(`Unsubscribing from ${table} changes`);
        supabase.removeChannel(channel);
      }
    };
  }, [channelName, table, schema, event, filter, onChange, enabled]);
}
