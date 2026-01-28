# Afterboards Automation "Orange Farmer"

An intelligent automation tool for **afterboards.in** practice tests that **learns as it plays**. The bot automatically extracts correct answers after each question and saves them for future use.

## ✨ Features

- **🧠 Auto-Learning**: Automatically extracts correct answers after submission and saves to `answers.json`
- **🎯 Smart Matching**: Uses multi-stage matching (exact → containment → similarity) for accurate question recognition
- **🔄 Continuous Operation**: Runs in cycles, getting smarter with each iteration
- **📊 Real-time Logging**: See exactly what the bot is doing and learning

---

## 🚀 Setup & Prerequisites

### 1. Install Node.js
- Download and install from [nodejs.org](https://nodejs.org/)
- Verify installation: `node -v`

### 2. Install Dependencies
Open a terminal in this folder and run:
```sh
npm install
```

### 3. Configure Browser Path
Open `automation.js` and update line 6 with your browser path:
```javascript
const BRAVE_PATH = 'C:\\path\\to\\your\\browser.exe';
```

**Finding your browser path:**
- Right-click browser shortcut → Properties → Copy the "Target" path
- Common locations:
  - **Brave**: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
  - **Chrome**: `C:\Program Files\Google\Chrome\Application\chrome.exe`

---

## 🏃‍♂️ How to Run

1. **Close all browser windows** completely
2. Open terminal in this folder
3. Run:
   ```sh
   npm start
   ```
4. Press Enter when prompted
5. **Watch it learn!** The bot will:
   - Navigate to the practice page
   - Select "Logarithms" topic
   - Answer questions (using known answers or random for new ones)
   - **Extract correct answers** after each submission
   - **Save new Q&A pairs** to `answers.json`
   - Restart and repeat

---

## 📁 Files

| File | Purpose |
|------|---------|
| `automation.js` | Main script with browser automation |
| `answers.json` | Question-answer database (auto-populated) |
| `agent-context.md` | Development notes |

---

## ⚙️ Configuration

Edit these constants in `automation.js`:

```javascript
const DELAY_PER_QUESTION = 3000;  // Wait time per question (ms)
const QUESTIONS_TO_ANSWER = 3;    // Answer first N questions
const QUESTIONS_TO_SKIP = 2;      // Skip last N questions
```

---

## 📝 Answer Database Format

The bot automatically populates `answers.json`:

```json
{
    "answers": [
        {
            "question": "If log_2(log_3(log_4 x)) = 0...",
            "type": "mcq",
            "answer": "A"
        },
        {
            "question": "Find the value of x...",
            "type": "type",
            "answer": "42"
        }
    ]
}
```

- **type**: `"mcq"` for multiple choice (A/B/C/D), `"type"` for numeric input
- **answer**: The correct option letter or number

---

## 🔍 How Matching Works

The bot uses a 3-stage matching system:

1. **Exact Match**: Normalized text comparison
2. **Containment Match**: Checks if one question contains another
3. **Similarity Score**: Combined metric (sequence + bidirectional tokens)
   - Requires **85%+ confidence** to accept a match

---

## ⚠️ Important Notes

- **Don't close the browser manually** - Use `Ctrl+C` in terminal
- **Don't interact with the page** while bot is running
- **Keep terminal visible** to monitor progress
- The bot reloads `answers.json` each cycle - you can edit it live!

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Browser doesn't launch | Check `BRAVE_PATH` is correct |
| "Cannot find module" error | Run `npm install` |
| Wrong answers extracted | Check debug output, adjust extraction logic |
| No matches found | Lower threshold in `findAnswer()` or add more Q&A manually |

## Credits
apartment firm

## Disclaimer
Bot learn as you use it, use it on a single topic for best result. default best with logarithms lod 2
