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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth client to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create service role client for database operations
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
      .select('*, restaurants(name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AUTHORIZATION: Verify the authenticated user owns this order
    if (order.user_id !== user.id) {
      console.error('Authorization failed: User does not own this order');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - you can only pay for your own orders' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark order as online payment selected (so UI and downstream logic reflect the choice)
    await supabase
      .from('orders')
      .update({ payment_method: 'online', payment_confirmed: false })
      .eq('id', orderId);

    const restaurant = order.restaurants;

    // Fetch payment credentials from secure table (only accessible via service role)
    const { data: credentials, error: credentialsError } = await supabase
      .from('restaurant_payment_credentials')
      .select('yoco_secret_key')
      .eq('restaurant_id', order.restaurant_id)
      .single();

    if (credentialsError || !credentials?.yoco_secret_key) {
      console.error('Credentials fetch error:', credentialsError);
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
        'Authorization': `Bearer ${credentials.yoco_secret_key}`,
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