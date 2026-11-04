# Maa'er Henschel — secure admin + category menu + direct photo upload (no R2 billing)

## Pages
- Customer website: `/`
- Admin panel: `/admin.html`

## Existing Cloudflare setup
Keep the existing D1 binding named `DB`, and the existing encrypted secrets `ADMIN_PASSWORD` and `SESSION_SECRET`. Do not remove them.

## One-time free image-upload setup (GitHub storage)
This version stores uploaded food photos in the public GitHub repository. No Cloudflare R2 subscription or payment method is used. Uploaded food images are public, so upload only photos intended for the public menu.

1. In GitHub, create a **fine-grained personal access token** for only the repository `maaerhenschel-oss/maaer-henschel-website`. Grant **Contents: Read and write** (Metadata read-only is normally selected automatically). Do not paste the token into chat or commit it to this repository.
2. In Cloudflare Dashboard, open Workers & Pages → `maaer-henschel-website` → Settings → Variables and Secrets → Production. Add `GITHUB_TOKEN` as an **encrypted secret** and paste the token there.
3. Add these production environment variables: `GITHUB_OWNER` = `maaerhenschel-oss`; `GITHUB_REPO` = `maaer-henschel-website`; `GITHUB_BRANCH` = `main`.
4. Save the settings and redeploy the latest production deployment.
5. Sign in to `/admin.html`. Choose a JPG, PNG, WEBP or GIF photo (maximum 5 MB) and save the product. The server uploads the photo to the repository `images/` folder and saves its public raw image URL with the product.

**Important:** Each uploaded photo creates a commit in the GitHub repository. If the Pages project automatically deploys on every commit to `main`, each photo upload may also start a deployment. The photo itself is publicly accessible because the repository is public. Never store the GitHub token in browser code, HTML, JavaScript files, or GitHub.

## Features
- Shared menu and categories use the existing D1 database.
- Admin login uses the existing server-verified password and signed session cookie.
- Add, edit and delete products and categories.
- Direct device photo upload via the protected `/api/upload` endpoint, stored in GitHub without R2.
- Existing public HTTPS image URLs remain supported.
