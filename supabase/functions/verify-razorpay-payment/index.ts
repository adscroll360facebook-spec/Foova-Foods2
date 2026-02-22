import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_data } = await req.json();
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keySecret) {
      return new Response(JSON.stringify({ error: "Razorpay not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(keySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const expectedSignature = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: "Payment verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create order in DB
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { error } = await supabase.from("orders").insert({
      ...order_data,
      payment_method: "razorpay",
      status: "confirmed",
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
