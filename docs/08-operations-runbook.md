# Operations Runbook

## Monitoring
- Review Edge Function logs for webhook failures and signature verification errors.
- Track order state mismatches (paid but not updated / updated without payment).

## Common incidents
### Webhook failing
- Confirm endpoint returns 2xx quickly; Yoco recommends within 15 seconds. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/listen-for-events))
- Confirm signature verification uses raw body + correct `whsec_...` secret. ([developer.yoco.com](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events))

### Suspected key exposure
- Rotate Yoco secret key and webhook secret; remove leaked values from any repo history if applicable. ([developer.yoco.com](https://developer.yoco.com/docs/checkout-api/authentication))
- Verify Lovable security view shows no exposed API keys. ([docs.lovable.dev](https://docs.lovable.dev/features/security))

## Releases
- Run Lovable security checker and record results in `docs/security/lovable-security-scan-log.md`. ([docs.lovable.dev](https://docs.lovable.dev/features/security))
