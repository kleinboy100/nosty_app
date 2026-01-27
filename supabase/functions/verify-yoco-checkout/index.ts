import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type VerifyRequest = {
  orderId: string;
};

const isApprovedStatus = (status: string | undefined | null) => {
  const normalized = (status || "").toLowerCase();
  return ["approved", "succeeded", "completed", "successful"].includes(normalized);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser();
    const user = userData?.user;

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId }: VerifyRequest = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load order and authorize
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, restaurant_id, payment_confirmed")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.payment_confirmed) {
      return new Response(JSON.stringify({ confirmed: true, reason: "already_confirmed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get latest pending payment for this order
    const { data: payment } = await supabase
      .from("payments")
      .select("id, yoco_checkout_id, status")
      .eq("order_id", orderId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.yoco_checkout_id) {
      return new Response(JSON.stringify({ confirmed: false, reason: "no_pending_payment" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch restaurant secret
    const { data: credentials, error: credentialsError } = await supabase
      .from("restaurant_payment_credentials")
      .select("yoco_secret_key")
      .eq("restaurant_id", order.restaurant_id)
      .single();

    if (credentialsError || !credentials?.yoco_secret_key) {
      return new Response(
        JSON.stringify({ confirmed: false, error: "Restaurant has not configured online payments" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1) Fetch checkout
    const checkoutRes = await fetch(
      `https://payments.yoco.com/api/checkouts/${payment.yoco_checkout_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${credentials.yoco_secret_key}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!checkoutRes.ok) {
      const text = await checkoutRes.text();
      return new Response(
        JSON.stringify({ confirmed: false, reason: "checkout_fetch_failed", details: text }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const checkout = await checkoutRes.json();
    const checkoutStatus = checkout?.status as string | undefined;
    const paymentId = (checkout?.paymentId as string | null | undefined) ?? null;

    // 2) Fetch payment if available
    let paymentStatus: string | null = null;
    if (paymentId) {
      const payRes = await fetch(`https://payments.yoco.com/api/v1/payments/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${credentials.yoco_secret_key}`,
          "Content-Type": "application/json",
        },
      });

      if (payRes.ok) {
        const pay = await payRes.json();
        paymentStatus = (pay?.status as string | undefined) ?? null;
      }
    }

    const confirmed =
      isApprovedStatus(paymentStatus) ||
      isApprovedStatus(checkoutStatus) ||
      (!!paymentId && checkoutStatus?.toLowerCase?.() === "completed");

    if (confirmed) {
      await supabase
        .from("payments")
        .update({ status: "completed", yoco_payment_id: paymentId })
        .eq("id", payment.id);

      await supabase
        .from("orders")
        .update({ payment_method: "online", payment_confirmed: true })
        .eq("id", orderId);
    }

    return new Response(
      JSON.stringify({
        confirmed,
        checkoutId: payment.yoco_checkout_id,
        checkoutStatus: checkoutStatus ?? null,
        paymentId,
        paymentStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("verify-yoco-checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
