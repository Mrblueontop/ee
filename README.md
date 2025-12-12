# Upload Instructions for Cloudflare Pages

**IMPORTANT: Use drag & drop, NOT GitHub with build commands**

## How to Deploy:

1. Go to https://pages.cloudflare.com
2. Click "Upload assets"
3. Drag only the FILES from this folder (not the folder itself):
   - index.html
   - app.js
   - styles.css
   - .nojekyll

**Important:** Do NOT set any build command. Leave "Build command" empty in Cloudflare Pages settings.

## Update Worker URL

After deploying the Cloudflare Worker, update `app.js`:

Find this line:
```javascript
const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL';
```

Replace with your actual worker URL:
```javascript
const WORKER_URL = 'https://auth-email-worker.subdomain.workers.dev';
```

Then re-deploy to Cloudflare Pages.
