# FitBrowse - Static Fitness Exercise Companion 🏋️‍♂️⚡

**FitBrowse** is a premium, static, mobile-first web application designed for quick workout browsing and routine planning. It operates entirely client-side, requiring no backend database, logins, or trackers. Pre-bundled with over 850 exercises, FitBrowse is optimized for speed, offline performance, and gym-floor convenience.

🚀 **Live Demo:** [https://sagistiki.github.io/imunim/](https://sagistiki.github.io/imunim/)

---

## ✨ Features

### 🔍 Search & Advanced Filtering
* **Instant Text Search:** Fast, client-side, debounced searching matching exercise names.
* **Agagonist Split Filters:** Multi-select criteria for target **Muscles** (Chest, Biceps, Calves, etc.) and **Equipment** (Dumbbells, Barbells, Kettlebells, etc.).
* **💪 Bodyweight Toggle:** A prominent one-click toggle to filter for bodyweight-only and no-equipment routines.
* **Level & Category Splits:** Dropdown selectors to sort exercises by difficulty (Beginner, Intermediate, Expert) and motion categories (Strength, Stretching, Cardio, etc.).
* **Instant In-Memory Updates:** All search and filter operations occur dynamically in memory with zero latency.

### 🖼️ Hover Preview & Step Animations
* **Zero-Lag Hover preview:** Hovering your mouse over any exercise card immediately shifts the image from `0.jpg` to `1.jpg`, previewing the motion without opening the details modal.
* **GIF-like Slide Loop:** Opening an exercise modal automatically cycles between the two demonstration images every 800ms, showing the exercise movement.

### 📋 Custom Workout Planner ("Sets")
* **Manual Workout Planning:** Manually create custom routines ("Sets") and add/remove exercises to them on the fly.
* **🧠 Smart Routine Generator:** A custom heuristic algorithm that generates balanced workouts based on:
  * Focus Area (Full Body, Upper, Lower, Push, Pull, Core)
  * Gear Split (Any Gear vs. Bodyweight Only)
  * Size constraints (4, 6, or 8 exercises)
  * *Behind the Scenes:* Shuffles the pool and prioritizes Compound movements first (60% weightage) over Isolation details (40% weightage) to ensure safe and structured workout progressions.
  * *Re-roll (Swap) Support:* Click "Swap" on any generated card to swap it with a fresh random match from the pool.
* **Local Persistence:** All custom routines and favorite lists are stored directly on your device via `localStorage` (`fitness:routines` & `fitness:favorites`).

### ⏱️ Fullscreen Workout Player
* **Immersive Interface:** A fullscreen modal wrapper that mimics a native iOS/Android fitness application.
* **Set Tracker:** Track target sets (3, 4, or 5 sets) and log completed sets with satisfying checkmarks.
* **Auto-Rest Timer:** Logging a set automatically starts the Rest Timer overlay. Customize timer breaks on the fly (`-15s` / `+15s`) depending on your stamina.
* **Audio Alerts:** Synthesizes a native browser audio "beep" when the rest countdown reaches `0:00` to alert you to start the next set.

### 🌐 On-Demand Hebrew Translations
* **English Default:** Displays in English by default to keep the interface fast and clean.
* **On-Demand Translate Toggle:** Click **"עברית (HE)"** inside details modals or the workout player to instantly translate titles and detailed instructions using a free client-side Google Translate API call.
* **RTL Formatting:** Translated Hebrew instructions are reformatted to align right-to-left (`dir="rtl"`) for reading comfort.

---

## 🛠️ Tech Stack

* **Core Library:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 6](https://vite.dev/) (Optimized for lightning-fast Hot Module Replacement)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (With HSL slate-dark colors, glows, and glassmorphism)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Hosting & CI/CD:** [GitHub Pages](https://pages.github.com/) & [GitHub Actions](https://github.com/features/actions)

---

## 💻 Local Development Setup

To run and modify this repository locally:

### 1. Clone the repository
```bash
git clone https://github.com/sagistiki/imunim.git
cd imunim
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the local development server
```bash
npm run dev
```
Open [http://localhost:5173/imunim/](http://localhost:5173/imunim/) in your web browser.

### 4. Build for production
To bundle the application, compile TypeScript, and minify assets for deployment:
```bash
npm run build
```
Production assets are generated in the `/dist` directory.

---

## 🚀 Deployment to GitHub Pages

Deployment is fully automated using GitHub Actions.

1. The configuration is declared in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
2. On every push to the `main` branch, the workflow:
   * Checks out the code.
   * Installs packages and builds the production bundle.
   * Deploys the built files (`/dist`) to a dedicated `gh-pages` branch.
3. **Important Configuration:** Ensure the `base` path in [vite.config.ts](vite.config.ts) matches your repository name (currently configured as `/imunim/`).
4. **GitHub Settings:** In your GitHub Repository, go to `Settings` ➜ `Pages` and ensure the source is set to build from the `gh-pages` branch (`/root` folder).

---

## 📄 License
This project utilizes exercise routines compiled from the Public Domain repository [free-exercise-db](https://github.com/yuhonas/free-exercise-db).
All code is open-source and free to adapt.
