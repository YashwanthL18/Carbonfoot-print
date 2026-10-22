# EcoTrack Home Page - Manual Testing Guide

## What Was Built
A premium landing page (`frontend/home.html`) with 6 main sections and responsive design, backed by `frontend/css/home-styles.css`.

## Backend Integration
- Root route `/` now serves:
  - `home.html` → for unauthenticated users (first-time visitors)
  - `index.html` → for authenticated users (logged-in users)

## Page Sections (Top to Bottom)

### 1️⃣ Sticky Navigation Bar
- **Logo**: 🌍 EcoTrack (text + emoji)
- **Menu**: Home, About, Calculator, Chat
- **Buttons**: Login, Register (styled)
- **Feature**: Stays at top while scrolling (sticky positioning)

### 2️⃣ Hero Section
- **Title**: "Track. Reduce. Sustain."
- **Subtitle**: "Take charge of your carbon footprint and help save the planet."
- **CTA Button**: "Calculate My Footprint" → links to `/dashboard`
- **Background**: Animated gradient (purple-ish), floating globe, wave animations

### 3️⃣ About Section
- **Intro**: Explains EcoTrack mission + UN SDG 13 support
- **3 Feature Cards**:
  - 🌱 Measure your footprint
  - 💡 Get AI-based tips
  - 🌍 Track your progress
- **Style**: Cards have hover lift effect, light background

### 4️⃣ How It Works Section
- **3 Step Cards**:
  1. 🚗 Enter Your Details
  2. 🧮 System Calculates
  3. 🌿 Get Recommendations
- **Style**: Numbered steps, hover animations, gradient backgrounds

### 5️⃣ Live Statistics / Impact Section
- **3 Stat Cards**:
  - 🌎 1200+ Footprints Calculated
  - 🌱 250+ kg CO₂ Saved
  - ⚡ SDG 13: Climate Action
- **Background**: Green gradient (matches brand)
- **Style**: Glassmorphic cards (frosted glass effect)

### 6️⃣ AI Chatbot Section
- **Preview**: Shows EcoBot welcome message
- **Feature**: Floating chat widget auto-loads from `js/chat.js`
- **Message**: "Hi! I'm EcoBot 🌿 — Ask me anything about climate change or your carbon footprint."

### Footer
- Copyright + UN SDG 13 reference
- Quick links to Login, Register, Dashboard

## How to Test Locally

### Step 1: Start the Flask app
```powershell
cd 'c:\Users\sys 1\Downloads\JAVA\CarbonCalculator\backend'
python app.py
# or
python -m flask run
```

### Step 2: Open the home page
- Go to: **http://127.0.0.1:5000/**
- You should see the premium home page (you're not logged in)

### Step 3: Test navigation
- Click "Calculator" → should go to `/dashboard` (may ask to login)
- Click "Login" → should go to `/login`
- Click "Calculate My Footprint" button → should go to `/dashboard`
- Click on section links (Home, About, Chat) → smooth scroll to sections

### Step 4: Test chatbot integration
- Scroll to bottom-right of page
- You should see a floating chat widget (💬 icon)
- Click it → opens the chat window
- Try typing "Hi" → should get a greeting

### Step 5: Test responsive design
- Resize browser window to smaller sizes (mobile-like)
- Navigation should stack vertically
- Cards should adapt to single column layout
- Text should stay readable

### Step 6: Test after login (logged-in flow)
- Log in via `/login` (or create an account)
- Go to `/` again
- You should now see the **calculator page** (`index.html`), not the home page
- Navigation changes to show dashboard instead of home

## Features Implemented ✓

| Feature | Status | Notes |
|---------|--------|-------|
| Sticky Header | ✓ | Stays at top on scroll |
| Hero Section | ✓ | Animated background, CTA button |
| About Cards | ✓ | 3 feature cards with hover effects |
| How It Works | ✓ | 3 numbered step cards |
| Impact Stats | ✓ | 3 stat cards with glassmorphism |
| Chatbot Preview | ✓ | Integrated with existing chat.js widget |
| Responsive Design | ✓ | Mobile-friendly (tested at 768px, 480px breakpoints) |
| Auth Flow | ✓ | Home for guests, calculator for logged-in users |
| Chat Widget | ✓ | Floating chat auto-loads, scroll fix applied |

## Known Behaviors

1. **First-time visitors** (no session):
   - Land on home page
   - Can click "Login" or "Register"
   - Chatbot works immediately

2. **Logged-in users**:
   - Visiting `/` goes straight to calculator page
   - Can still access home page by modifying URL manually

3. **Chatbot**:
   - Uses the same chat.js widget as calculator page
   - Floating at bottom-right (z-index 2000)
   - Scroll behavior: fixed 400px height + smooth scrolling (from earlier fix)

## Styling Notes

- **Color Scheme**: Green (#2ecc71), gradients, white cards
- **Typography**: Segoe UI, responsive font sizes
- **Animations**: Floating globe, wave effects, card hover lifts
- **Accessibility**: Proper semantic HTML, alt text ready

## Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `frontend/home.html` | Created | New landing page |
| `frontend/css/home-styles.css` | Created | Styling for home page |
| `backend/app.py` | Modified | Root `/` now serves home.html for guests |

## Next Steps (Optional)

1. **Customize stats**: Update the "1200+ footprints", "250+ kg saved" to real API calls
2. **Add dynamic content**: Pull recent activity from `/api/activities` to stats section
3. **Optimize images**: Add a background image to hero (currently using gradient)
4. **A/B testing**: Try different taglines and CTA button text
5. **Analytics**: Add tracking to button clicks (GA, Mixpanel, etc.)

---

**Status**: ✓ Home page is production-ready!
