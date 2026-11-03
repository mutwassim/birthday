# 🎂 Magical 3D Birthday Web App

A production-ready, interactive, and emotional Birthday Web Experience built with **Vite**, vanilla JavaScript (ES modules), **Three.js** (3D), and **GSAP** (animation).

---

## ✨ Features & Experience Flow

1. **Gate / Intro Scene**:
   - Dark, soft-glowing starry atmosphere with ambient fairy dust.
   - "Someone has something for you…" with a pulsing glowing button: **"Tap to open ✨"**.
   - Tapping initializes audio playback (background music + chimes) and initiates a cinematic camera zoom into the 3D scene.
2. **3D Birthday Cake Scene**:
   - Stylized low-poly multi-tier cake with frosting swirls, berries, gold trim, and birthday candles.
   - Flickering flame sprites and warm point lights with UnrealBloom post-processing.
   - User can blow out the candles by tapping the 3D cake directly or using the interactive button.
   - Extinguishing the flame produces a smoke puff particle effect and celebratory audio whoosh.
3. **Celebration & Confetti Burst**:
   - High-performance `InstancedMesh` 3D confetti system raining and fluttering in the recipient's favorite colors.
   - 3D balloons floating upward with physics-inspired sinusoidal sway.
   - Joyful celebration chime harmonics and "Happy Birthday!" banner.
4. **Secret PIN Verification Modal**:
   - Playful, romantic security checkpoint when tapping *"Read Your Letter 💌"*.
   - Prompts Bisma to enter her 6-digit phone PIN (`052004`).
   - Incorrect entries trigger a playful GSAP shake and error prompt.
   - Correct PIN triggers an unlock chime, lock-to-open animation, and grants access to the letter!
5. **Personal Letter Scene (3 Interactive Pages)**:
   - Glassmorphic card overlay with subtle 3D mouse parallax.
   - Recipient name displayed in elegant script typography (`Great Vibes`).
   - Multi-page love letter with *"Next Page →"* and *"← Previous"* buttons, smooth GSAP transitions, and special highlight tributes.
6. **3D Memories Gallery**:
   - Floating polaroid cards arranged in a 3D cylindrical carousel.
   - Drag or touch swipe to freely spin the carousel.
   - Click/tap any photo to smoothly zoom and inspect with a GSAP ease.
7. **Grand Finale**:
   - Continuous 3D fireworks particle explosions illuminating the night sky.
   - Glowing pending gifts note: *"The treat and gifts are pending, hope you like this small effort of mine ❤️"*.
   - Heartfelt sign-off: *"From always yours, Basit"*.
   - **"Replay Experience ↺"** button to restart the journey from the beginning.
7. **Audio & Sound System**:
   - Background music with GSAP volume fade-in and mute/unmute header toggle.
   - Supports custom `/public/music.mp3`. If absent or not provided, an automatic built-in **Web Audio API music-box synthesizer** plays an enchanting, delicate "Happy Birthday" chime melody!

---

## 🛠️ Personalization Guide

All personal customizations are configured in a single file: **[`src/config.js`](./src/config.js)**.

```javascript
// src/config.js

// 1. Names & Age
export const RECIPIENT_NAME = "Bisma";
export const SENDER_NAME = "Basit";
export const AGE = "18"; // 18th birthday celebration!
export const LETTER_PIN = "052004"; // Mobile phone PIN required to unlock the letter

// 2. Heartfelt Personal Message (Each line animates with GSAP)
export const PERSONAL_MESSAGE = [
  "Happy 18th Birthday to the most radiant and extraordinary soul in my world.",
  "Stepping into 18 is such a magical milestone, and watching you shine brings me endless joy.",
  "Your laughter illuminates every moment, and your gentle, loving heart inspires me every day.",
  "May this special year shower you with unforgettable adventures, pure happiness, and every dream your heart holds.",
  "Always remember how deeply cherished, admired, and loved you are."
];

// 3. Color Palette (Used for confetti, balloons, and glow accents)
export const FAVORITE_COLORS = [
  "#ff6fa5", // Rose pink
  "#ffd166", // Warm golden yellow
  "#8ecae6", // Pastel sky blue
  "#b388ff", // Soft lilac
  "#06d6a0"  // Mint sparkle
];

// 4. Photos (Add your pictures into /public/photos/)
export const PHOTOS = [
  "/photos/photo1.svg", // Replace with /photos/trip.jpg, etc.
  "/photos/photo2.svg",
  "/photos/photo3.svg",
  "/photos/photo4.svg",
  "/photos/photo5.svg"
];

// 5. Background Music (Add an mp3 into /public/music.mp3)
export const MUSIC = "/music.mp3";
```

### Adding Your Own Photos:
1. Place your photos (`.jpg`, `.png`, or `.webp`) into the [`public/photos/`](./public/photos/) directory.
2. In `src/config.js`, update the `PHOTOS` array to match your filenames:
   ```javascript
   export const PHOTOS = [
     "/photos/us_at_beach.jpg",
     "/photos/graduation.jpg",
     "/photos/concert.jpg",
     "/photos/cozy_cafe.jpg"
   ];
   ```

### Adding Your Own Music:
- Place any `.mp3` audio file at [`public/music.mp3`](./public/music.mp3).
- If no file is provided, the built-in Web Audio chime music box will play automatically.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized, minified production build in the `dist/` directory.

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)
1. Push your project to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

Alternatively, with the Vercel CLI:
```bash
npx vercel
```

### Deploy to Netlify
1. Go to [app.netlify.com](https://app.netlify.com/) and drag-and-drop the `dist/` folder, OR link your repository.
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Click **Deploy Site**.

---

## 📁 Project Structure

```
├── public/
│   ├── photos/          # Photo gallery images (photo1.svg, etc.)
│   ├── music.mp3        # Custom background audio
│   └── favicon.ico      # Birthday cake favicon
├── src/
│   ├── config.js        # Single configuration file for names, message, colors, photos
│   ├── main.js          # Core Three.js renderer, bloom composer, and scene loop
│   ├── style.css        # Responsive glassmorphism UI overlay styles
│   ├── scenes/
│   │   ├── intro.js         # Gate screen and tap-to-open unlock logic
│   │   ├── cake.js          # 3D cake model, candle flame, and blow-out mechanics
│   │   ├── celebration.js   # Confetti and balloon launch choreography
│   │   ├── message.js       # Line-by-line GSAP text reveal and card parallax
│   │   ├── gallery.js       # 3D cylindrical carousel with drag and zoom
│   │   └── finale.js        # 3D fireworks particle system and replay loop
│   └── utils/
│       ├── audio.js         # Web Audio API music-box synthesizer & sound effects
│       ├── particles.js     # InstancedMesh confetti, balloons, fireworks, smoke
│       ├── resize.js        # Responsive aspect ratio and DPR management
│       └── dispose.js       # Memory leak prevention and resource disposal
├── screenshots/         # Captured E2E screenshots of all 6 scenes
├── index.html           # HTML entry point with semantic accessibility tags
└── package.json         # Vite, Three.js, GSAP dependencies
```

---

## 📱 Accessibility & Performance

- **Mobile First**: Fluid layouts, responsive font scaling, touch drag on carousel, and tap hitboxes.
- **`prefers-reduced-motion` Support**: Automatically detects system preferences and dials back particle counts and camera zooms.
- **60fps Performance**: Uses `THREE.InstancedMesh` for confetti and `Float32Array` buffer attributes for sparkles and fireworks.
