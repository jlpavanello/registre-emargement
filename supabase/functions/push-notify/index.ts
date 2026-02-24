// Edge Function: push-notify
// Envoie des notifications Web Push à tous les appareils abonnés (sauf l'expéditeur)
// Appelée par le client après l'envoi d'un message chat

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { senderDeviceId, senderName, messagePreview } = await req.json();

    if (!senderDeviceId || !senderName) {
      return new Response(
        JSON.stringify({ error: "Missing senderDeviceId or senderName" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Configure VAPID
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidContact =
      Deno.env.get("VAPID_CONTACT_EMAIL") || "admin@police-municipale.fr";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    webpush.setVapidDetails(
      `mailto:${vapidContact}`,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all subscriptions except sender's device
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .neq("device_id", senderDeviceId);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError.message);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No subscribers" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: senderName,
      body: (messagePreview || "").substring(0, 120),
      icon: "/registre-emargement/icon-192.png",
      badge: "/registre-emargement/icon-192.png",
      data: {
        url: "/registre-emargement/",
        type: "chat_message",
      },
    });

    // Send push to each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          return { device_id: sub.device_id, status: "sent" };
        } catch (err: unknown) {
          const pushError = err as { statusCode?: number; message?: string };
          // Subscription expired or invalid — clean up
          if (
            pushError.statusCode === 410 ||
            pushError.statusCode === 404
          ) {
            console.log(
              `Removing expired subscription: ${sub.device_id}`
            );
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `Push notifications: ${sent} sent, ${failed} failed (${subscriptions.length} total subscribers)`
    );

    return new Response(
      JSON.stringify({ sent, failed }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Push notify error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
