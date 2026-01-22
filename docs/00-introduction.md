# Documentation Index

These docs follow a practical structure inspired by Diátaxis: architecture + how-to/runbook + reference-style notes. ([diataxis.fr](https://diataxis.fr/))

## What this app is
A marketplace-style takeaway ordering app built with Lovable (frontend) + Supabase (backend) + Yoco (online payments).

## Doc map
- Architecture: `01-architecture.md`
- Environments & secrets: `02-environments-and-secrets.md`
- Database & RLS: `03-database-and-rls.md`
- Edge Functions: `04-edge-functions.md`
- Payments (Yoco): `05-payments-yoco.md`
- Security: `06-security.md`
- Privacy & retention: `07-privacy-and-data-retention.md`
- Operations runbook: `08-operations-runbook.md`
- Testing & release: `09-testing-and-release.md`
- Security scan logs: `security/lovable-security-scan-log.md`

## Documentation rules
- Never paste secrets/tokens in docs or screenshots (redact). ([docs.lovable.dev](https://docs.lovable.dev/features/security))
- Treat frontend code as public; document server-side enforcement (Edge Functions + RLS). ([docs.lovable.dev](https://docs.lovable.dev/tips-tricks/avoiding-security-pitfalls))
