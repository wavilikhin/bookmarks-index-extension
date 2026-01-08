# =============================================================================

# LOCAL DEVELOPMENT SETUP GUIDE

# =============================================================================

## Prerequisites

1. Clerk account with Native API enabled
2. CRX keypair generated from https://itero.plasmo.com/tools/generate-keypairs
3. Backend server running (for tRPC API)

## Environment Files Setup

### .env.development (development-only settings)

```env
# CRX Public Key - ensures consistent extension ID during development
# Get this from: https://itero.plasmo.com/tools/generate-keypairs
CRX_PUBLIC_KEY=MIIBIjANBgkqh...your_public_key...
```

### .env.local (shared local settings)

```env
# API Configuration
PLASMO_PUBLIC_API_URL=http://localhost:3000/trpc

# Clerk Configuration
PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
```

### .env.production (production settings - NO CRX key!)

```env
PLASMO_PUBLIC_API_URL=https://your-api.com/trpc
PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
# NOTE: No CRX_PUBLIC_KEY here - Chrome Web Store assigns its own
```

## One-Time Clerk Setup

### Register your Extension ID with Clerk

After running `bun dev` once, get your extension ID from `chrome://extensions`.
Then register it with Clerk's API:

```bash
curl -X PATCH https://api.clerk.com/v1/instance \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-type: application/json" \
  -d '{"allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID"]}'
```

This only needs to be done ONCE as long as you use the same CRX_PUBLIC_KEY.

## Development Workflow

### Starting Development

```bash
# 1. Start your backend server (in another terminal)
cd ../bookmarks-index-server && bun dev

# 2. Start Plasmo dev server
bun dev
```

### Loading the Extension (First Time)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select: `build/chrome-mv3-dev`
5. Note your Extension ID - it should match your CRX ID!

### Hot Reloading

Plasmo automatically:

- Rebuilds on file changes
- Reloads the extension bundle
- Updates your new tab page

You do NOT need to:

- Remove and re-add the extension
- Manually refresh (in most cases)

### If Extension Stops Working

Sometimes Chrome needs a manual refresh:

1. Go to `chrome://extensions`
2. Click the refresh icon (🔄) on your extension
3. Open a new tab

## Testing Clerk Authentication

### Supported Auth Methods (Extension Popup/NewTab)

- ✅ Email + Password
- ✅ Email + OTP (one-time password)
- ✅ SMS + OTP
- ✅ Passkeys
- ❌ OAuth (Google, GitHub, etc.) - requires Sync Host
- ❌ Email magic links - requires Sync Host
- ❌ SAML - requires Sync Host

### If You Need OAuth

You'll need to set up "Sync Host" - this syncs auth from a web app to the extension.
See: https://clerk.com/docs/guides/sessions/sync-host

## Troubleshooting

### "Invalid URL scheme" error after login

Your extension ID isn't registered with Clerk. Run the curl command above.

### Extension ID keeps changing

Your CRX_PUBLIC_KEY isn't being loaded. Check:

- `.env.development` exists and has `CRX_PUBLIC_KEY=...`
- Run `bun dev` (not `bun build`)
- Check manifest.json in `build/chrome-mv3-dev/` has a `"key"` field

### Auth modal doesn't appear

- Check browser console for errors
- Verify PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY is set
- Make sure Clerk's Native API is enabled in dashboard

### Changes not reflecting

- Hard refresh: Ctrl+Shift+R on the new tab page
- Reload extension in chrome://extensions
- Restart `bun dev`

## Useful Commands

```bash
bun dev              # Start dev server with hot reload
bun build            # Production build (for Chrome Web Store)
bun run package      # Create .zip for Chrome Web Store upload
bun run tsc          # Type check
bun run lint         # Lint code
```

## File Loading Priority (Plasmo)

For `bun dev` (development):

1. `.env.development.local`
2. `.env.development`
3. `.env.local`
4. `.env`

For `bun build` (production):

1. `.env.production.local`
2. `.env.production`
3. `.env.local`
4. `.env`

This is why CRX_PUBLIC_KEY in .env.development only appears in dev builds!
