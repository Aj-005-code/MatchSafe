# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in MatchSafe, please do **not** open a public GitHub issue.

Instead, email the maintainer or contributors directly with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 48 hours. Confirmed vulnerabilities will be patched promptly.

## Security Design

MatchSafe was designed with privacy and security as first principles:

- **No plaintext secrets in code** — all credentials loaded from environment variables
- **AES-256-GCM** for data-at-rest encryption (authenticated encryption)
- **JWT with short expiry** — access tokens expire in 1 hour
- **HttpOnly cookies** — tokens not accessible to JavaScript
- **Zero chat logs** — messages never written to disk or database
- **Google OAuth only** — no password storage

## Environment Variable Safety

Never commit `.env` to version control. The `.gitignore` in this repo explicitly excludes it.
The `.env.example` file contains only placeholder values — never real credentials.
