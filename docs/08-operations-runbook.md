# Operations Runbook

This guide covers daily monitoring, incident response, and the critical process for secret rotation within KasiConnect.

## 📡 Monitoring & Health Checks

### 1. Webhook Health
- **Location:** Supabase Dashboard > Edge Functions > `yoco-webhook` > Logs.
- **What to look for:** - `401 Unauthorized`: Indicates a signature mismatch (likely an incorrect `YOCO_WEBHOOK_SECRET`).
    - `500 Error`: Check logs for database timeout or payload schema changes.
- **Performance:** Ensure the function execution time is < 5 seconds to comply with Yoco's timeout requirements.

### 2. Order Consistency
- **Audit:** Occasionally compare Yoco Business Portal successful payments against the `payments` table in Supabase.
- **Mismatch:** If a payment is "Succeeded" in Yoco but "Awaiting Payment" in KasiConnect, manually check the `yoco-webhook` logs for that `checkoutId`.

---

### 🔐 Secret Rotation & Leak Response

If a secret (Yoco Key or Webhook Secret) is exposed in a public log, GitHub commit, or chat, follow these steps immediately.

#### Step 1: Rotate the Yoco Webhook Secret
1. Go to your **Yoco Developer Portal**.
2. Navigate to **Webhooks** and click **Regenerate Secret** for your production endpoint.
3. **Important:** Your current webhook will immediately stop working until Step 2 is finished.

#### Step 2: Update Supabase Secrets
1. Open your terminal and use the Supabase CLI:
   ```bash
   supabase secrets set YOCO_WEBHOOK_SECRET=whsec_your_new_secret_here
## Releases
- Run Lovable security checker and record results in `docs/security/lovable-security-scan-log.md`. ([docs.lovable.dev](https://docs.lovable.dev/features/security))
