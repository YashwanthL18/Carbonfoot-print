# App User Flow - Complete End-to-End Guide

## 🎯 Overall User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     ECOTRACK USER FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: User opens app (http://127.0.0.1:5000/)                │
│  ├─ Backend checks: Is user logged in?                          │
│  ├─ NO → Serve home.html (landing page)                         │
│  └─ YES → Serve index.html (calculator page)                    │
│                                                                   │
│  Step 2: User clicks "Login" button                             │
│  ├─ Navigate to /login page                                     │
│  └─ See login form                                              │
│                                                                   │
│  Step 3: User enters email & password, submits                  │
│  ├─ Frontend sends POST to /api/login                           │
│  ├─ Backend validates & sets session['user_id']                 │
│  ├─ Frontend receives success response                          │
│  └─ Frontend redirects to / (HOME)                              │
│                                                                   │
│  Step 4: User back at / (now authenticated)                     │
│  ├─ Backend checks: Is user logged in?                          │
│  ├─ YES → Serve index.html (CALCULATOR PAGE)                    │
│  └─ User can now use full app!                                  │
│                                                                   │
│  Step 5: (Optional) User clicks "Home" in nav                   │
│  ├─ Navigate to /#about (smooth scroll to sections)             │
│  └─ Still see same page (index.html has home sections)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🏠 Home Page (Unauthenticated Users)

**URL**: `/` (when not logged in)  
**File**: `frontend/home.html`

### Sections:
1. ✅ **Sticky Navigation Bar**
   - Logo: 🌍 EcoTrack
   - Links: Home, About, Calculator, Chat
   - Buttons: Login, Register

2. ✅ **Hero Section**
   - Title: "Track. Reduce. Sustain."
   - Subtitle: "Take charge of your carbon footprint..."
   - Button: "Calculate My Footprint" → `/dashboard`
   - Animated background (globe + waves)

3. ✅ **About Section**
   - 3 Feature cards: Measure, Tips, Track

4. ✅ **How It Works**
   - 3 Step cards: Enter → Calculate → Recommend

5. ✅ **Impact Stats**
   - 3 Stat cards: 1200+ footprints, 250+ kg CO₂ saved, SDG 13

6. ✅ **Chatbot Section**
   - Preview + floating chat widget (auto-loads)

## 📊 Calculator Page (Authenticated Users)

**URL**: `/` (when logged in) OR `/dashboard`  
**File**: `frontend/index.html`

### Features:
- Full carbon footprint calculator
- Input: Travel, Energy, Food
- Output: Results + Recommendations
- Chat widget available
- Dashboard with history/stats

## 🔐 Authentication Flow (Step-by-Step)

### Login Page (`/login`)
```
┌──────────────────────┐
│  LOGIN FORM          │
├──────────────────────┤
│  Email: [_______]    │
│  Password: [_______] │
│  [LOGIN BUTTON]      │
└──────────────────────┘
       ↓
  User submits
       ↓
  POST /api/login
       ↓
  Backend validates
       ↓
  Session['user_id'] = 42  ← Backend sets this
       ↓
  Return { success: true }
       ↓
  Frontend gets response
       ↓
  window.location.href = '/'  ← Auto redirect to /
       ↓
  Page reloads at /
       ↓
  Backend checks session['user_id'] (EXISTS!)
       ↓
  Serve index.html (Calculator page)
       ↓
  User sees calculator
```

### Register Page (`/register`)
```
  User fills form
       ↓
  POST /api/register
       ↓
  User created in DB
       ↓
  Redirect to /login
       ↓
  User logs in (same as above)
```

## 💻 How to Test Locally

### Start the app:
```powershell
cd 'c:\Users\sys 1\Downloads\JAVA\CarbonCalculator\backend'
python app.py
# or
python -m flask run --port 5000
```

### Test Scenario 1: Fresh visitor (no login)
```
1. Open http://127.0.0.1:5000/
2. You see: HOME PAGE (with all 6 sections)
3. Click "Login" button
4. You see: LOGIN PAGE
5. Enter test credentials
6. You see: CALCULATOR PAGE (auto-redirected)
```

### Test Scenario 2: Return user (already logged in)
```
1. Open http://127.0.0.1:5000/
2. Browser has session cookie
3. You see: CALCULATOR PAGE directly (no home page)
4. You can click "Home" in nav to see home sections
```

### Test Scenario 3: Different routes
```
/                    → Home page (if not logged in) OR Calculator (if logged in)
/login               → Login form
/register            → Register form
/dashboard           → Dashboard (calculator page with history)
/profile             → User profile
/api/login           → Backend login endpoint
/api/register        → Backend register endpoint
/api/chat            → Chat API
```

## 🔄 Navigation & Redirects

### From Home Page (unauthenticated):
- "Login" → `/login`
- "Register" → `/register`
- "Calculator" nav link → `/dashboard` (might show login first)
- "Calculate My Footprint" button → `/dashboard`
- Section links (Home, About, Chat) → smooth scroll

### After Login:
- You land on `/` but see calculator page (`index.html`)
- Can click "Home" in nav to jump to home sections
- "Logout" redirects you back to home page

## 📝 Key Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `frontend/home.html` | Created | Landing page (all 6 sections) |
| `frontend/css/home-styles.css` | Created | Styling for home page |
| `frontend/js/auth.js` | Updated | Redirect login to `/` instead of `/dashboard` |
| `frontend/login.html` | Updated | Header link now points to `/` (home) |
| `backend/app.py` | Updated | Root `/` serves home.html or index.html based on session |

## ✅ Verification Checklist

- [x] Unauthenticated user at `/` sees home page
- [x] Home page has all 6 sections (header, hero, about, how it works, stats, chatbot)
- [x] Chatbot widget auto-loads on home page
- [x] Login button works and goes to `/login`
- [x] Login form submits and sets session
- [x] After login, user redirected to `/` (root) automatically
- [x] At `/`, authenticated user sees calculator page instead
- [x] All existing features still work (no breaking changes)
- [x] Navigation bar works on all pages
- [x] Responsive design works on mobile

## 🎨 Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Home page landing | ✅ | Shows to unauth users |
| Auth-based routing | ✅ | Same `/` URL, different content based on login |
| Login flow | ✅ | Auto-redirects to `/` |
| Calculator accessible | ✅ | After login or direct `/dashboard` |
| Chat widget | ✅ | Works on both home & calculator pages |
| Sticky navbar | ✅ | On all pages |
| Responsive design | ✅ | Mobile-friendly |
| No breaking changes | ✅ | All existing features preserved |

---

## 🚀 You're Ready!

The app is now connected and ready to use. Users will:
1. **See the beautiful home page first** (no login page on initial load)
2. **Click Login** when they want to access the calculator
3. **Get auto-redirected** to the calculator after successful login
4. **Have a smooth, modern experience** with the premium home design

Just run the Flask app and visit http://127.0.0.1:5000/ to see it in action!
