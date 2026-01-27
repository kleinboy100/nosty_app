import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate redirect URLs to prevent open redirect attacks
const validateRedirectUrl = (url: string | undefined, allowedOrigin: string, defaultPath: string): string => {
  if (!url) {
    return `${allowedOrigin}${defaultPath}`;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow same origin to prevent phishing redirects
    if (parsed.origin !== allowedOrigin) {
      console.warn(`Rejected redirect to different origin: ${parsed.origin}, expected: ${allowedOrigin}`);
      return `${allowedOrigin}${defaultPath}`;
    }
    
    // Validate path format - only allow /orders/{uuid} paths
    const uuidPattern = /^\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (!uuidPattern.test(parsed.pathname)) {
      console.warn(`Rejected redirect to non-order path: ${parsed.pathname}`);
      return `${allowedOrigin}${defaultPath}`;
    }
    
    return url;
  } catch (error) {
    console.error('Invalid URL provided:', error);
    return `${allowedOrigin}${defaultPath}`;
  }
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

    // Determine allowed origin for redirect validation
    const requestOrigin = req.headers.get('origin');
    const allowedOrigin = requestOrigin || new URL(supabaseUrl).origin;
    
    // Validate all redirect URLs to prevent open redirect attacks
    const validatedSuccessUrl = validateRedirectUrl(
      successUrl, 
      allowedOrigin, 
      `/orders/${orderId}?payment=success`
    );
    const validatedCancelUrl = validateRedirectUrl(
      cancelUrl, 
      allowedOrigin, 
      `/orders/${orderId}?payment=cancelled`
    );
    const validatedFailureUrl = validateRedirectUrl(
      failureUrl, 
      allowedOrigin, 
      `/orders/${orderId}?payment=failed`
    );

    // Create Yoco checkout with validated URLs
    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${restaurant.yoco_secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'ZAR',
        successUrl: validatedSuccessUrl,
        cancelUrl: validatedCancelUrl,
        failureUrl: validatedFailureUrl,
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