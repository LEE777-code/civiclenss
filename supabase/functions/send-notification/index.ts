import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Firebase Admin SDK (initialized once)
let adminInitialized = false;
let admin: any;

async function initializeFirebase() {
  if (adminInitialized) return;
  
  const { initializeApp, cert } = await import("https://esm.sh/firebase-admin@12.0.0/app");
  const { getMessaging } = await import("https://esm.sh/firebase-admin@12.0.0/messaging");

  const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY") || "{}");

  initializeApp({
    credential: cert(serviceAccount),
  });

  admin = { messaging: getMessaging };
  adminInitialized = true;
}

serve(async (req) => {
  try {
    await initializeFirebase();

    const { notification_id } = await req.json();

    if (!notification_id) {
      return new Response(
        JSON.stringify({ error: "notification_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1: Load notification from database
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (notifError || !notification) {
      console.error("Notification not found:", notifError);
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        { status: 404 }
      );
    }

    // Step 2: Resolve recipients
    let targetUserIds: string[] = [];

    if (notification.recipient_type === "user") {
      // Direct to specific user
      targetUserIds = [notification.recipient_clerk_id];
    } else if (notification.recipient_type === "broadcast") {
      // Broadcast to all users EXCEPT the actor
      const { data: allUsers, error: usersError } = await supabase
        .from("user_devices")
        .select("clerk_id")
        .neq("clerk_id", notification.actor_clerk_id || "")
        .eq("notifications_enabled", true);

      if (!usersError && allUsers) {
        targetUserIds = Array.from(new Set(allUsers.map(u => u.clerk_id)));
      }
    }

    if (targetUserIds.length === 0) {
      console.log("No target users for notification");
      
      // Update status to failed (no recipients)
      await supabase
        .from("notifications")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", notification_id);

      return new Response(
        JSON.stringify({ message: "No recipients found" }),
        { status: 200 }
      );
    }

    // Step 3: Fetch FCM tokens for target users
    const { data: devices, error: devicesError } = await supabase
      .from("user_devices")
      .select("fcm_token, platform")
      .in("clerk_id", targetUserIds)
      .eq("notifications_enabled", true)
      .not("fcm_token", "is", null);

    if (devicesError || !devices || devices.length === 0) {
      console.error("No devices found for targets:", devicesError);
      
      // Update status to failed (no devices)
      await supabase
        .from("notifications")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", notification_id);

      return new Response(
        JSON.stringify({ message: "No devices found" }),
        { status: 200 }
      );
    }

    // Step 4: Send FCM notifications
    const tokens = devices.map(d => d.fcm_token);

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: notification.type,
        report_id: notification.report_id || "",
        notification_id: notification_id,
      },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`✅ Sent to ${response.successCount}/${tokens.length} devices`);

      // Step 5: Update notification status to sent
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", notification_id);

      return new Response(
        JSON.stringify({ 
          ok: true, 
          sent: response.successCount,
          failed: response.failureCount 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (fcmError) {
      console.error("FCM send error:", fcmError);

      // Update status to failed (FCM error)
      await supabase
        .from("notifications")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", notification_id);

      return new Response(
        JSON.stringify({ error: "FCM send failed", details: String(fcmError) }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
