# 🍊 Orange Farmer — Afterboards Auto-Learning Bot

<p align="center">
  <img src="orange-farmer-banner.jpg" alt="Orange Farmer Banner" width="400"/>
</p>

An intelligent automation tool for **afterboards.in** practice tests that **learns as it plays**. The bot answers questions, extracts the correct answers after submission, and saves them for future use — getting smarter with every cycle.

> **Works on Windows & macOS** — supports Brave, Edge, Chromium, Opera, and Vivaldi.

---

## 📋 Table of Contents

1. [What Does This Do?](#-what-does-this-do)
2. [Requirements](#-requirements)
3. [Step-by-Step Installation](#-step-by-step-installation)
4. [How to Run](#-how-to-run)
5. [Using the Menu](#-using-the-menu)
6. [The Live Dashboard](#-the-live-dashboard)
7. [Configuration](#-configuration)
8. [Files Explained](#-files-explained)
9. [Troubleshooting](#-troubleshooting)
10. [Tips & Notes](#-tips--notes)

---

## ✨ What Does This Do?

1. Opens your browser and navigates to an Afterboards.in practice test
2. Answers 5 questions per cycle (first 3 it tries to answer, last 2 it skips)
3. After submitting, it **reads the correct answer** from the page
4. **Saves every correct answer** to a local database (`answers.json`)
5. On the next cycle, it **recognizes questions** it's seen before and answers correctly
6. Repeats forever — or until your set time limit runs out

> **The more you run it, the smarter it gets!**

---

## 📌 Requirements

- **A computer** running Windows 10/11 or macOS
- **A Chromium-based browser** (one of the following):
  - ✅ Brave (recommended)
  - ✅ Microsoft Edge
  - ✅ Chromium
  - ✅ Opera
  - ✅ Vivaldi
  - ❌ Google Chrome (not supported — technical limitation)
- **Node.js** (the runtime that executes the script)
- **An Afterboards.in account** (you must be logged in)

---

## 🛠️ Step-by-Step Installation

### Step 1: Download and Install Node.js

Node.js is the engine that runs this script. Think of it like installing a program that lets your computer run JavaScript.

#### On Windows:

1. Go to **https://nodejs.org/**
2. Click the big green button that says **"LTS"** (Long Term Support) — this is the stable version
3. A file like `node-v20.x.x-x64.msi` will download
4. **Double-click** the downloaded file to open the installer
5. Click **Next → Next → Next** (accept all defaults)
6. ✅ Make sure **"Add to PATH"** is checked (it should be by default)
7. Click **Install**, then **Finish**

#### On macOS:

1. Go to **https://nodejs.org/**
2. Click the big green **"LTS"** button
3. Open the downloaded `.pkg` file
4. Follow the installer prompts — click **Continue → Continue → Install**
5. Enter your Mac password if asked, then click **Close**

#### Verify it worked:

1. Open a terminal:
   - **Windows**: Press `Win + R`, type `cmd`, press Enter
   - **macOS**: Press `Cmd + Space`, type `Terminal`, press Enter
2. Type this and press Enter:
   ```
   node -v
   ```
3. You should see something like `v20.11.0` — this means Node.js is installed! ✅

> ⚠️ If you see an error like `'node' is not recognized`, try restarting your computer and trying again.

---

### Step 2: Download the Project

You should already have the project folder (the one containing `automation.js`). If someone sent it to you as a ZIP file:

1. **Right-click** the ZIP file → **Extract All** (Windows) or double-click it (macOS)
2. Choose where to extract it (e.g., your Desktop)
3. You should now have a folder with these files inside:
   ```
   📁 Raze/
   ├── automation.js      ← the main script
   ├── package.json       ← dependency list
   ├── config.json        ← your settings
   ├── answers.json       ← question database (auto-generated)
   └── README.md          ← this file
   ```

---

### Step 3: Install Dependencies

The script needs one additional package (puppeteer-core) to control your browser.

1. Open a terminal / command prompt
2. Navigate to the project folder. For example:
   - **Windows**:
     ```
     cd C:\Users\YourName\Desktop\orange-farmer-CLI
     ```
   - **macOS**:
     ```
     cd ~/Desktop/orange-farmer-CLI
     ```
   > 💡 **Tip**: Replace the path with wherever your project folder actually is.
3. Run this command:
   ```
   npm install
   ```
4. Wait for it to finish (it might take 30-60 seconds)
5. You should see a message with no errors — that means it worked! ✅

> 💡 You only need to do this **once**. You don't need to run `npm install` again unless you delete the `node_modules` folder.

---

### Step 4: Log Into Afterboards

Before running the bot, you need to be logged into Afterboards.in in the browser the bot will use.

1. Open your browser (Brave, Edge, etc.)
2. Go to **https://www.afterboards.in/**
3. Log in with your account
4. You can close the browser after logging in — the bot will remember your session

> ⚠️ You only need to do this once per browser. The bot uses your browser's saved session/cookies.

---

## 🏃 How to Run

Every time you want to use Orange Farmer:

1. **Close all windows** of the browser you'll be using (important!)
2. Open a terminal / command prompt
3. Navigate to the project folder:
   ```
   cd C:\Users\YourName\Desktop\orange-farmer-CLI
   ```
4. Start the bot:
   ```
   npm start
   ```
5. You'll see the **Orange Farmer** banner and the main menu
6. Follow the on-screen prompts!

---

## 📖 Using the Menu

When you start the app, you'll see these options:

| Option | What it does |
|--------|-------------|
| **1) Start Automation** | Begins the bot — it will ask how long to run, then launch your browser |
| **2) Select Topic** | Choose which Afterboards topic to practice (e.g., Logarithms, Percentages) |
| **3) View Statistics** | Shows how many questions answered, cycles completed, etc. |
| **4) View Configuration** | Displays your current settings |
| **5) Edit Configuration** | Change settings like delay time, matching threshold, etc. |
| **6) Select Browser** | Pick which browser to use (auto-detected or enter a custom path) |
| **7) Reset Database** | Clears all learned answers from `answers.json` (asks for confirmation) |
| **8) Exit** | Quit the program |

### First-time setup flow:
1. Press **6** → Select your browser (the bot auto-detects installed browsers)
2. Press **2** → Select the topic you want to practice
3. Press **1** → Start the automation!

---

## 📊 The Live Dashboard

While the bot is running, you'll see a live-updating dashboard:

```
╔══════════════════════════════════════════════════╗
║  🍊 ORANGE FARMER — Running                     ║
╠══════════════════════════════════════════════════╣
║  Cycles:    3                                    ║
║  Answered:  9                                    ║
║  Skipped:   6                                    ║
║  Runtime:   4m 32s / 10m 00s                     ║
║                                                  ║
║  Question:  [████████████░░░░░░░░] 3/5           ║
║  Database:  ✓ HIT                                ║
║                                                  ║
║  Press Q to stop and return to menu              ║
╚══════════════════════════════════════════════════╝
```

| Field | Meaning |
|-------|---------|
| **Cycles** | How many complete test rounds have been done |
| **Answered** | Total questions the bot actually answered |
| **Skipped** | Total questions the bot skipped (last 2 per cycle) |
| **Runtime** | How long it's been running / time limit (if set) |
| **Question** | Progress bar showing which question (1-5) in the current cycle |
| **Database** | Whether the last question was found in the database (✓ HIT) or not (✗ MISS) |

### Controls during automation:
- Press **Q** → Stop the bot and return to the menu
- Press **Ctrl+C** → Force quit the entire program

---

## ⚙️ Configuration

Settings are stored in `config.json`. You can edit them through the menu (option 5) or directly in the file:

```json
{
    "browserPath": "C:\\...\\brave.exe",
    "userDataDir": "C:\\...\\User Data",
    "browserName": "Brave",
    "practiceUrl": "https://www.afterboards.in/practice?section=",
    "delayPerQuestion": 3000,
    "questionsToAnswer": 3,
    "questionsToSkip": 2,
    "matchingThreshold": 0.85,
    "headless": false,
    "defaultTopic": "Logarithms"
}
```

| Setting | What it does | Default |
|---------|-------------|---------|
| `delayPerQuestion` | Wait time between questions in milliseconds | `3000` (3 sec) |
| `questionsToAnswer` | How many questions to actually answer per cycle | `3` |
| `questionsToSkip` | How many to skip at the end of each cycle | `2` |
| `matchingThreshold` | How confident the bot must be to match a question (0-1) | `0.85` (85%) |
| `headless` | Run browser invisibly (`true`) or visibly (`false`) | `false` |
| `defaultTopic` | Which topic to auto-select on startup | `"Logarithms"` |

> 💡 **Tip**: Set `delayPerQuestion` lower (e.g., `2000`) to go faster, or higher (e.g., `5000`) if the site is slow.

---

## 📁 Files Explained

| File | What it is |
|------|-----------|
| `automation.js` | The main script — all the bot logic lives here |
| `config.json` | Your settings (browser path, delays, thresholds) |
| `answers.json` | The database of learned questions & answers (auto-generated) |
| `package.json` | Lists the required npm packages |
| `node_modules/` | Folder created by `npm install` — contains downloaded packages |

### Answer Database Format (`answers.json`)

The bot automatically builds this file. Each entry looks like:

```json
{
    "question": "If log_2(log_3(log_4 x)) = 0...",
    "type": "mcq",
    "answer": "A"
}
```

- **type**: `"mcq"` = multiple choice (A/B/C/D), `"type"` = numeric keypad input
- **answer**: The correct answer (option letter or number)

---

## 🔧 Troubleshooting

### "node is not recognized" or "command not found"
- Node.js isn't installed or not added to PATH
- **Fix**: Reinstall Node.js, make sure "Add to PATH" is checked, then restart your terminal

### "Cannot find module" error
- Dependencies aren't installed
- **Fix**: Run `npm install` in the project folder

### Browser doesn't launch
- Browser path is incorrect or the browser isn't installed
- **Fix**: Use menu option **6** to re-select your browser

### "Profile in use" or "User data directory already in use"
- Another instance of the browser is still open
- **Fix**: Close ALL windows of that browser (check your system tray / taskbar too), then try again

### Bot seems stuck or page doesn't load
- Afterboards site might be slow or down
- **Fix**: Press **Q** to stop, wait a moment, then try again

### "Google Chrome is not supported"
- Chrome has technical restrictions that prevent the bot from working with it
- **Fix**: Use **Brave**, **Edge**, or another supported browser instead

### Bot doesn't find answers it previously learned
- Question text might have slight variations
- **Fix**: Try lowering `matchingThreshold` in config (e.g., from `0.85` to `0.80`)

---

## 💡 Tips & Notes

- 🔄 **The bot gets smarter over time** — the more cycles it runs, the more correct answers it learns
- 📚 **Stick to one topic** for best results — the database builds up faster
- ⏱️ **Set a time limit** so you don't forget to stop it — you'll be prompted when starting
- ✏️ **You can edit `answers.json` manually** if you know correct answers
- 🔙 **The bot reloads answers every cycle**, so changes you make are picked up immediately
- 🚫 **Don't interact with the browser** while the bot is running — let it do its thing
- 🖥️ **Keep the terminal visible** so you can see the dashboard and press Q if needed

---

## 👤 Credits

Made by **Apartment firm**

## ⚖️ Disclaimer

This tool is for educational/personal use. Use responsibly. The bot learns as you use it — for best results, focus on a single topic at a time.
