# Payments (Yoco)

## Payment methods
- Cash on Delivery (COD)
- Online card payment via Yoco Checkout API + Webhooks

## Checkout creation
- Checkout API calls are authenticated via `Authorization: Bearer <secret-key>`. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- Create checkouts server-side to avoid exposing secret keys. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/accepting-a-payment))

## Webhook processing (source of truth)
We do not trust client redirects for payment success; we rely on Yoco webhooks. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/accepting-a-payment) [developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/listen-for-events))

### Verification requirements
Before processing event data, the webhook handler:
1) Checks `webhook-timestamp` is recent (recommended ≤ 3 minutes). ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))
2) Verifies `webhook-signature` using HMAC SHA-256 over `webhook-id.webhook-timestamp.rawBody` and the `whsec_...` secret. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

### Performance requirement
Webhook endpoint should respond 2xx quickly (Yoco recommends within 15 seconds). ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/listen-for-events))

## DB mapping (typical)
- On payment succeeded: `payments.status = completed`; order remains `pending` until restaurant approval.
- On payment failed: `payments.status = failed`; order may be canceled automatically or returned to cart (product choice).- Failure behavior / retry expectations: <note what you observe>
