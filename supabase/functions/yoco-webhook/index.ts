import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-yoco-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('YOCO_WEBHOOK_SECRET');
    
    // SECURITY: Require webhook secret to be configured - reject all requests otherwise
    if (!webhookSecret) {
      console.error('YOCO_WEBHOOK_SECRET not configured - rejecting webhook for security');
      return new Response(
        JSON.stringify({ error: 'Webhook verification not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get signature from header for verification
    const signature = req.headers.get('x-yoco-signature');
    
    if (!signature) {
      console.error('Missing webhook signature - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get raw body for signature verification
    const rawBody = await req.text();

    // Compute expected signature using HMAC-SHA256
    const computedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const computedBuffer = Buffer.from(computedSignature, 'utf8');
    
    // Length check first (not timing sensitive - lengths are fixed for HMAC-SHA256)
    if (signatureBuffer.length !== computedBuffer.length) {
      console.error('Invalid webhook signature length - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(signatureBuffer, computedBuffer)) {
      console.error('Invalid webhook signature - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Webhook signature verified successfully');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = JSON.parse(rawBody);
    console.log('Yoco webhook received:', JSON.stringify({ type: payload.type, id: payload.payload?.id }));

    const { type, payload: eventPayload } = payload;

    if (type === 'payment.succeeded') {
      const checkoutId = eventPayload.metadata?.checkoutId || eventPayload.checkoutId;
      const paymentId = eventPayload.id;
      const orderId = eventPayload.metadata?.orderId;

      // Idempotency check - prevent duplicate processing
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('status')
        .eq('yoco_checkout_id', checkoutId)
        .maybeSingle();

      if (existingPayment?.status === 'completed') {
        console.log('Payment already processed for checkout:', checkoutId);
        return new Response(
          JSON.stringify({ received: true, status: 'duplicate' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          yoco_payment_id: paymentId,
        })
        .eq('yoco_checkout_id', checkoutId);

      if (paymentError) {
        console.error('Payment update error:', paymentError);
      }

      // Find order from payment record if not in metadata
      let targetOrderId = orderId;
      if (!targetOrderId) {
        const { data: paymentData } = await supabase
          .from('payments')
          .select('order_id')
          .eq('yoco_checkout_id', checkoutId)
          .single();
        targetOrderId = paymentData?.order_id;
      }

      // Update order: set payment_confirmed = true and payment_method = online
      if (targetOrderId) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            payment_method: 'online',
            payment_confirmed: true
          })
          .eq('id', targetOrderId);

        if (orderError) {
          console.error('Order update error:', orderError);
        } else {
          console.log('Order payment_confirmed set to true for:', targetOrderId);
        }
      }

      console.log('Payment succeeded for checkout:', checkoutId);
    } else if (type === 'payment.failed') {
      const checkoutId = eventPayload.metadata?.checkoutId || eventPayload.checkoutId;

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('yoco_checkout_id', checkoutId);

      console.log('Payment failed for checkout:', checkoutId);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
