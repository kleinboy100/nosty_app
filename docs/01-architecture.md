# Architecture

## High-level components
- **Client (Lovable UI):** Mobile-first interface utilizing a Bottom Navigation bar.
- **Supabase Edge Functions:** Acts as the secure "API layer" for Yoco integrations and signature verification.
- **Database Logic:** Custom SQL functions handle order validation to ensure data integrity.



## Key flows (Implemented)
### Secure Order Flow
1. **Submission:** Customer submits order items from the cart.
2. **Validation:** The database function `create_validated_order` ignores client-side prices and recalculates the total directly from the `menu_items` table.
3. **Creation:** Order is created with status `awaiting_payment` (for online) or `pending` (for COD).

### Payment Verification Flow
1. **Webhook:** Yoco sends a `payment.succeeded` event.
2. **Verification:** Edge Function `yoco-webhook` computes an HMAC-SHA256 signature using the `YOCO_WEBHOOK_SECRET`.
3. **Update:** Only if the signature matches, the order status updates. This prevents "fake" payment successes from unauthorized sources.

## Mobile Navigation Strategy
The app uses a persistent **BottomNav** component on mobile devices to improve reachability. It includes:
- Home (Discovery)
- Orders (Tracking)
- Cart (with real-time item badge)
- Dashboard (for Restaurant Owners)
- Profile/Auth- **Yoco:** Checkout creation (server-side) + webhooks for payment confirmation. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication) [developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/listen-for-events))

## Key flows
### Order flow (COD)
1) Customer submits cart → server validates + creates order + payment record.
2) Restaurant approves/declines.
3) Restaurant updates progress + ETA → customer sees updates in real time.

### Order flow (Online payment)
1) Server creates Yoco checkout (never from browser). ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
2) Customer completes payment.
3) Yoco webhook → Edge Function verifies signature + timestamp → updates DB. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

### Restaurant onboarding
1) Restaurant registers.
2) Verification (current: basic). Roadmap includes ID/proof/CIPC checks.
3) Restaurant may apply for online payments within the app.
