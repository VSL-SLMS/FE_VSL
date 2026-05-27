# FE_VSL

Frontend for SLMS, built with Next.js and deployed on Vercel.

## Local Development

```bash
npm install
npm run dev
```

Local URL:

```txt
http://localhost:3000
```

The frontend expects the backend API at:

```txt
http://localhost:5050/api
```

Override it with `.env.local` when needed:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050/api
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:5050
```

## Vercel Deployment

Set these environment variables in Vercel before deploying:

```bash
NEXT_PUBLIC_API_BASE_URL=https://bevsl-production.up.railway.app/api
NEXT_PUBLIC_BACKEND_ORIGIN=https://bevsl-production.up.railway.app
```

Use the deployed backend origin, not `localhost`.

Recommended Vercel settings:

```txt
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
Output Directory: .next
Node.js Version: 20.x
```

## Validation

```bash
npm run lint
npm run build
```
