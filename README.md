# GRWMS — GeoTech Railway Waste Management System
**Government of India · Ministry of Railways · v2.0**

## Three separate URLs — no tab switching

| URL | Who uses it | Access |
|-----|-------------|--------|
| `https://yourapp.com/` | Citizens / Railway Staff | No login — open to all |
| `https://yourapp.com/vendor` | Cleaning vendor | OTP login |
| `https://yourapp.com/admin` | Railway Board supervisor | Password + OTP |

## How it works end-to-end

1. **User opens `/`** — sees a live OpenStreetMap map of their area
2. **Taps "Report Garbage"** — camera opens, GPS is fetched automatically (real device GPS via `navigator.geolocation`)
3. **Takes photo** → selects garbage type → confirms station + adds note
4. **Taps "Send Report"** — complaint is created instantly in the shared store
5. **Vendor opens `/vendor`** → sees new task in inbox + "Task Map" tab with the complaint pin on the real map
6. **Admin opens `/admin`** → "Live Map" tab shows all complaints plotted on real OpenStreetMap with status-colored pins; can filter by status

## Quick Start

```bash
npm install
npm start
# User app:   http://localhost:3000/
# Vendor app: http://localhost:3000/vendor
# Admin:      http://localhost:3000/admin
```

## Deploy (Vercel — 60 seconds)

```bash
npm install -g vercel
vercel
```

Set homepage in package.json if deploying to a subdirectory:
```json
"homepage": "https://yourapp.com"
```

## Map

Uses **OpenStreetMap + Leaflet** (free, no API key needed).  
Real GPS via `navigator.geolocation.getCurrentPosition()` — works on any HTTPS site.  
Falls back to New Delhi coords for demo/localhost.

## Mobile

- User app (`/`) — phone-width layout, works as PWA
- Vendor app (`/vendor`) — responsive sidebar collapses on mobile
- Admin (`/admin`) — responsive sidebar collapses on mobile

## Structure

```
src/
  App.jsx                    ← BrowserRouter, shared AppContext (complaints state)
  data/mockData.js
  utils/helpers.js
  components/
    LiveMap.jsx              ← Leaflet map (GPS, pins, popups)
    UI.jsx                   ← Badge, KPI, Modal, Table, etc.
    Sidebar.jsx
    ComplaintCard.jsx
  pages/
    user/UserPortal.jsx      ← Map home → camera → GPS → picker → confirm → success
    vendor/VendorPortal.jsx  ← Tasks + Task Map (live pins)
    admin/AdminPortal.jsx    ← Dashboard + Live Map + Complaints + Vendors + Reports
```
