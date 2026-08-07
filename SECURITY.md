# Security policy (portfolio project)

## Secrets

- Never commit `.env`, service-role keys, or database passwords.
- Rotate keys if they appear in chat, screenshots, or public forks.
- The dashboard must only use the **publishable / anon** key.
- The simulator may use the **secret / service_role** key on a trusted machine only.

## Reporting

If you find a credential leak in this repository, open a private note to the author and rotate the affected Supabase keys immediately.
