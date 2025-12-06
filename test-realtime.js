// Quick Test Script for Viewed By Admin Feature
// Paste this in browser console on CLIENT side to test real-time updates

async function testRealtimeUpdates() {
    console.log('🔍 Testing Real-Time Updates...\n');

    // Get current report ID from URL
    const reportId = window.location.pathname.split('/').pop();
    console.log('📋 Report ID:', reportId);

    // Import supabase (assuming it's available globally or import it)
    const { supabase } = await import('./src/lib/supabase');

    console.log('\n✅ Step 1: Checking Supabase connection...');
    const { data: testData, error: testError } = await supabase
        .from('reports')
        .select('id, title, viewed_by_admin')
        .eq('id', reportId)
        .single();

    if (testError) {
        console.error('❌ Connection Error:', testError);
        return;
    }

    console.log('✅ Connected! Current report data:', testData);

    console.log('\n✅ Step 2: Setting up real-time listener...');
    const channel = supabase
        .channel(`test-report-${reportId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'reports',
                filter: `id=eq.${reportId}`
            },
            (payload) => {
                console.log('\n🎉 REAL-TIME UPDATE RECEIVED!');
                console.log('📦 Payload:', payload);
                console.log('🆕 New viewed_by_admin:', payload.new.viewed_by_admin);
                console.log('🆕 New admin_viewed_at:', payload.new.admin_viewed_at);
            }
        )
        .subscribe((status) => {
            console.log('📡 Subscription status:', status);
        });

    console.log('\n✅ Step 3: Waiting for updates...');
    console.log('👉 Now go to ADMIN and click "View Details" on this report');
    console.log('👉 You should see a message above when the update happens');

    // Auto-unsubscribe after 2 minutes
    setTimeout(() => {
        console.log('\n⏱️ Test timeout - cleaning up');
        supabase.removeChannel(channel);
    }, 120000);
}

// Run the test
console.log('🚀 Starting test...\n');
testRealtimeUpdates();
