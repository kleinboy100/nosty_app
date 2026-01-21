import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, successUrl, cancelUrl, failureUrl } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details with restaurant info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, restaurants(yoco_secret_key, name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const restaurant = order.restaurants;
    
    if (!restaurant?.yoco_secret_key) {
      return new Response(
        JSON.stringify({ error: 'Restaurant has not configured online payments. Please contact the restaurant.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Amount in cents (Yoco expects cents)
    const amountInCents = Math.round(order.total_amount * 100);

    // Create Yoco checkout
    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${restaurant.yoco_secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'ZAR',
        successUrl: successUrl || `${req.headers.get('origin')}/orders/${orderId}?payment=success`,
        cancelUrl: cancelUrl || `${req.headers.get('origin')}/orders/${orderId}?payment=cancelled`,
        failureUrl: failureUrl || `${req.headers.get('origin')}/orders/${orderId}?payment=failed`,
        metadata: {
          orderId: orderId,
          restaurantName: restaurant.name,
        },
      }),
    });

    if (!yocoResponse.ok) {
      const errorData = await yocoResponse.text();
      console.error('Yoco API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment checkout' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const yocoCheckout = await yocoResponse.json();
    console.log('Yoco checkout created:', yocoCheckout.id);

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: amountInCents,
        currency: 'ZAR',
        status: 'pending',
        yoco_checkout_id: yocoCheckout.id,
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
    }

    return new Response(
      JSON.stringify({ 
        checkoutUrl: yocoCheckout.redirectUrl,
        checkoutId: yocoCheckout.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});