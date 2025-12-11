import dotenv from 'dotenv';

dotenv.config();

const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("--- KEY DIAGNOSTIC ---");
if (!key) {
    console.error("❌ No Supabase Key found in environment variables!");
} else {
    try {
        const parts = key.split('.');
        if (parts.length !== 3) {
            console.error("❌ Key does not look like a valid JWT (wrong number of parts)");
        } else {
            const payload = JSON.parse(atob(parts[1]));
            console.log(`🔑 Key Role: '${payload.role}'`);

            if (payload.role === 'service_role') {
                console.log("✅ GOOD: This is a Service Role (Admin) Key.");
            } else {
                console.log("⚠️  WARNING: This is an '${payload.role}' Key (Public).");
                console.log("   It CANNOT create buckets or bypass RLS policies.");
                console.log("   You need the 'service_role' key for the backend.");
            }
        }
    } catch (e) {
        console.error("❌ Failed to decode key:", e.message);
    }
}
console.log("----------------------");
