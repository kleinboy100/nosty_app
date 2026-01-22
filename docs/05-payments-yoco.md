# Payments (Yoco)

## Overview
We use Yoco Checkout API for payments and Yoco Webhooks for asynchronous payment status updates.

## Webhook registration
- Endpoint: https://payments.yoco.com/api/webhooks
- Registered URL: <your-supabase-function-url>
- Note: Registration returns a `secret` used to verify events. ([developer.yoco.com](https://developer.yoco.com/checkout-api-reference/webhooks/register-webhook))

## Webhook event flow
1) Yoco sends POST events to our endpoint. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/overview))
2) Our Edge Function verifies timestamp + signature before processing. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))
3) We update `payments` and `orders` accordingly.

## Operational notes
- Webhook should respond 2xx quickly; Yoco recommends within ~15 seconds. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/listen-for-events))
- Failure behavior / retry expectations: <note what you observe>
