import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("Checking Supabase Connection...");
console.log("URL:", supabaseUrl ? "Set" : "Missing");
console.log("Key Length:", supabaseKey ? supabaseKey.length : "Missing");
// Simple check if it *looks* like a service key (usually longer, but not always) or just checking if we can perform admin actions.

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        console.log("1. Listing Buckets...");
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error("❌ List Buckets Failed:", listError.message);
            console.error("Full Error:", listError);
            if (listError.message.includes("violates row-level security") || listError.statusCode === 403) {
                console.error("⚠️  PERMISSIONS ISSUE: The key provided likely does not have admin rights (Service Role Key required).");
            }
            return;
        }

        console.log("✅ Buckets Found:", buckets.map(b => b.name));

        const reportsBucket = buckets.find(b => b.name === 'reports');
        if (reportsBucket) {
            console.log("✅ 'reports' bucket exists.");
        } else {
            console.log("⚠️ 'reports' bucket MISSING. Attempting to create...");
            const { data, error: createError } = await supabase.storage.createBucket('reports', {
                public: true,
                fileSizeLimit: 10485760,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
            });

            if (createError) {
                console.error("❌ Create Bucket Failed:", createError.message);
            } else {
                console.log("✅ 'reports' bucket created successfully!");
            }
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

check();
