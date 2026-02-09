import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to get their ID
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS and verify order ownership
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user owns this order and get restaurant details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        user_id,
        status,
        restaurant_id,
        restaurants (
          id,
          name,
          phone
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security check: verify the user owns this order
    if (order.user_id !== user.id) {
      console.warn(`Unauthorized access attempt: user ${user.id} tried to access order ${orderId}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order is in a valid status for calling (not completed or cancelled)
    const callableStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "awaiting_payment"];
    if (!callableStatuses.includes(order.status)) {
      return new Response(
        JSON.stringify({ error: "Cannot call for completed or cancelled orders" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const restaurant = order.restaurants as { id: string; name: string; phone: string | null };
    
    if (!restaurant?.phone) {
      return new Response(
        JSON.stringify({ error: "Restaurant phone not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the phone number
    return new Response(
      JSON.stringify({ 
        phone: restaurant.phone,
        restaurantName: restaurant.name 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-restaurant-phone:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
