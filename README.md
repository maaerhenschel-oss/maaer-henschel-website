# Maa'er Henschel — secure admin + shared menu update

## Website pages
- Customer website: `/`
- Admin login: `/admin.html`

## One-time Cloudflare setup
The database table and the first three menu items are created automatically by the website the first time it connects to D1. You do not need to write or run SQL.

1. In the Cloudflare Pages project `maaer-henschel-website`, open **Settings → Functions → D1 database bindings**. Add a binding with variable name `DB` and select the database `maaer-henschel-db`. Save it.
2. Open **Settings → Variables and secrets** for the Production environment. Add encrypted secret `ADMIN_PASSWORD` with a private password you choose.
3. Add encrypted secret `SESSION_SECRET` with a different, long random value (at least 32 characters). Do not share either secret in chat or put them in GitHub files.
4. Save settings and redeploy the latest `main` commit.

## What this version does
- Customer menu is loaded from the shared D1 database.
- Admin login is protected by a server-checked password and a signed, HttpOnly session cookie (8-hour expiry).
- Admin can add, edit, and delete menu items; changes appear on the customer website.
- The database table and the initial menu are created automatically; no SQL Console step is needed.
- Product photos currently use a public HTTPS image URL. Direct photo-file uploads are not included yet.
- WhatsApp ordering is not enabled until the business WhatsApp number is provided.

Keep the admin password private. The admin page URL is `/admin.html`.
