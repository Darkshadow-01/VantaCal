# VanCal - Deployment Guide

## Current Status

✅ **Build Passing** | ✅ **Production Ready**

## Quick Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

## Deployment Platforms

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms
- Railway
- Render
- Netlify
- Self-hosted with Docker

## Environment Variables

Required for production:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Convex (optional - currently uses localStorage)
CONVEX_DEPLOYMENT=prod:...
NEXT_PUBLIC_CONVEX_URL=https://...
```

## Build Output

The build generates:
- Static pages for `/` and `/calendar`
- Dynamic API routes under `/api/`
- Clerk authentication pages

## Performance

- Lighthouse target: 90+
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s

## Known Limitations

1. **Convex not integrated** - Using localStorage
2. **Demo mode** - Works without auth keys
3. **Google Calendar** - Import not configured

## Post-Deployment Checklist

- [ ] Verify build succeeds
- [ ] Test authentication flow
- [ ] Check calendar loads
- [ ] Verify event creation works
- [ ] Test dark mode toggle
- [ ] Check mobile responsive

## Support

- README.md - Full feature documentation
- QUICK_START.md - Quick setup guide
- AGENTS.md - Developer instructions