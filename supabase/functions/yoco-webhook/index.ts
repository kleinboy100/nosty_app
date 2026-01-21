import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Yoco webhook received:', JSON.stringify(payload));

    const { type, payload: eventPayload } = payload;

    if (type === 'payment.succeeded') {
      const checkoutId = eventPayload.metadata?.checkoutId || eventPayload.checkoutId;
      const paymentId = eventPayload.id;
      const orderId = eventPayload.metadata?.orderId;

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

      // Update order status to confirmed if payment succeeded
      if (orderId) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'pending' }) // Keep as pending for restaurant to confirm
          .eq('id', orderId);

        if (orderError) {
          console.error('Order update error:', orderError);
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