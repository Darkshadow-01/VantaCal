# VanCal Quick Start Guide

## Installation & Setup

```bash
# Install dependencies
pnpm install  # or npm install / yarn install

# Development server
pnpm dev  # or npm run dev

# Build for production
pnpm build
pnpm start
```

## Key URLs

| Page | Route | Purpose |
|------|-------|---------|
| Calendar | `/` | Main calendar interface |
| Dashboard | `/dashboard` | Stats and activity feed |
| Events | `/events` | Event management |
| Calendar View | `/calendar` | Alternative calendar view |
| Privacy | `/privacy` | Privacy & security settings |
| Sign In | `/sign-in` | User authentication |

## Test Data Available

### Health Events (Green)
- Morning Yoga (7:00 AM daily)
- Meditation (6:45 AM daily)
- Gym Workout (5:00 PM daily)
- Doctor Checkup (8:00 AM)
- And 2 more...

### Work Events (Blue)
- Team Standup (9:00 AM daily)
- Deep Work Session (10:00 AM)
- Project Planning (2:00 PM weekly)
- Client Call (10:30 AM monthly)
- And 3 more...

### Relationship Events (Purple)
- Family Dinner (7:00 PM weekly)
- Phone Call with Mom (8:00 PM weekly)
- Lunch with Sarah (12:30 PM)
- Movie Night (7:30 PM)
- And 1 more...

## Quick Testing

### Test 1: Create an Event
1. Navigate to `/events`
2. Click "New Event" button
3. Fill in: Title, System, Start Time, End Time
4. Click "Create Event"

### Test 2: Filter Events
1. On `/events` page
2. Click filter buttons: All, Health, Work, Relationships
3. Verify list updates accordingly

### Test 3: View Calendar
1. Navigate to `/` (main calendar)
2. Use top navigation to switch views
3. Use chevron buttons to navigate dates
4. Verify events display in correct colors

### Test 4: Dashboard Metrics
1. Go to `/dashboard`
2. Verify stats cards show accurate numbers
3. Check System Balance chart
4. Review activity feed

## Color Scheme

| System | Color | Hex | Usage |
|--------|-------|-----|-------|
| Health | Green | #228B22 | Health & wellness events |
| Work | Blue | #0066CC | Professional events |
| Relationships | Purple | #8B4A8B | Personal & social events |
| Primary BG | Galaxy Black | #2B262C | Main backgrounds |
| Primary Text | Wishful White | #F5F1E8 | Main text |
| Accents | Grey | #A8A8A8 | Borders & dividers |

## Component Structure

```
app/
├── page.tsx              # Main calendar
├── dashboard/
│   └── page.tsx         # Dashboard
├── events/
│   └── page.tsx         # Events management
├── calendar/
│   └── page.tsx         # Calendar view
├── privacy/
│   └── page.tsx         # Privacy settings
├── components/
│   ├── Header.tsx       # Top navigation
│   ├── EventList.tsx    # Event list component
│   └── ...
└── layout.tsx           # Root layout

components/
├── ui/
│   ├── sidebar.tsx      # Sidebar navigation
│   ├── topbar.tsx       # Date controls
│   ├── button.tsx
│   └── ...
└── Calendar/
    ├── VanCal.tsx       # Main calendar
    ├── sampleData.ts    # 18 test events
    └── ...
```

## Key Features Enabled

- [x] 18+ realistic test events
- [x] Event filtering by system
- [x] Calendar views (daily, weekly, monthly, yearly)
- [x] Dark mode support
- [x] Responsive design
- [x] Dashboard with stats
- [x] Activity feed
- [x] Buffer management
- [x] AI insights
- [x] Event CRUD operations
- [x] User authentication

## Performance Tips

- Use `/dashboard` for quick overview
- Use `/events` for event management
- Use `/` for detailed calendar view
- Dark mode reduces eye strain
- Mobile layout optimized for touch

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Events not showing | Check master key encryption status |
| Dark mode not applying | Clear browser cache |
| Events not filtering | Verify event system assignment |
| Sidebar not responding | Check browser console for errors |
| Slow loading | Check network tab, verify images load |

## Environment Variables Needed

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CONVEX_URL=...
```

## Development Notes

### File Sizes
- `app/components/EventList.tsx`: 320+ lines
- `components/Calendar/sampleData.ts`: 300+ lines of data
- `app/dashboard/page.tsx`: 170+ lines
- All optimized for performance

### Color Tokens
All colors defined in `app/globals.css` using CSS custom properties:
- `--foreground`: Primary text color
- `--background`: Primary background
- `--card`: Card backgrounds
- `--primary`: Brand color (Galaxy Black)
- `--muted`: Secondary colors
- `--border`: Border colors

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- All Tailwind breakpoints: sm, md, lg, xl, 2xl

## Next.js Features Used

- App Router with file-based routing
- Server Components (RSC)
- Middleware support
- Image optimization
- Font optimization
- Built-in CSS support (Tailwind v4)

## Testing Checklist

- [ ] All pages load without errors
- [ ] Events display in correct colors
- [ ] Filtering works for all systems
- [ ] Calendar views switch properly
- [ ] Dark mode toggle works
- [ ] Mobile layout is responsive
- [ ] Dashboard stats are accurate
- [ ] Event creation works
- [ ] Event deletion works
- [ ] Navigation links functional

## Support Resources

- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Full Summary**: See `BUILD_SUMMARY.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **Clerk Auth**: https://clerk.com/docs
- **Convex**: https://docs.convex.dev

## Getting Help

If something isn't working:
1. Check the browser console (F12)
2. Verify all environment variables are set
3. Clear browser cache and reload
4. Check that all dependencies are installed
5. Restart the development server

---

**Version**: 1.0.0 Complete
**Status**: Ready for Testing
**Last Updated**: March 23, 2026
