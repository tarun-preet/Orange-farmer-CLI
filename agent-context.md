# Agent Context

## Project: Afterboards.in Test Automation

### Current Status
- Fixed selectors based on actual DOM inspection
- Type-in input: `input.w-60.border.border-black`
- Next button: Button with text "Next Question"
- Submit button: Button with text "Submit"
- **NEW**: Auto-extraction of correct answers - the bot now learns!
- **UPDATED**: After completing 5 questions, clicks "Attempt Next Test" button instead of navigating back to practice URL (faster cycle)
- **UPDATED**: Each question now has a unique numeric ID (1, 2, 3...) for easy reference
- **NEW**: All configuration is now editable via `config.json` or the CLI menu

### Key Files
- `automation.js` - Main script with auto-learning capability
- `answers.json` - Question-answer database (auto-populated with unique IDs)
- `config.json` - **Configuration file (editable)**

### Features
1. **Auto-Learning**: After each submission, extracts the correct answer and saves to `answers.json`
2. **Duplicate Detection**: Won't save the same question twice (uses 80% token overlap check)
3. **Multiple Extraction Methods**: 
   - Text pattern matching ("Correct answer is X")
   - Green highlight detection
   - Green text color detection
   - Class/attribute-based detection
   - Number display for type-in questions
   - Checkmark symbol detection
4. **Fast Cycle Restart**: After completing 5 questions, clicks "Attempt Next Test" button to immediately start the next test (no page navigation required)
5. **Unique Question IDs**: Each question is assigned a unique numeric ID (1, 2, 3...) for easy reference and tracking
6. **Auto-Migration**: Existing questions without IDs are automatically assigned IDs on first load
7. **Editable Configuration**: All settings can be changed via `config.json` or the CLI menu (option 5)
8. **Browser Auto-Detection**: Automatically detects installed Chromium browsers (Chrome, Brave, Edge, Chromium, Opera, Vivaldi) on Windows. On first run, prompts user to select from detected browsers — no manual path entry needed. Uses existing browser profile (no new profile created). Detection runs once at startup, zero impact on automation speed.

### Configuration (config.json)
```json
{
    "browserPath": "",
    "userDataDir": "",
    "browserName": "",
    "practiceUrl": "https://www.afterboards.in/practice?section=",
    "delayPerQuestion": 3000,
    "questionsToAnswer": 3,
    "questionsToSkip": 2,
    "matchingThreshold": 0.85,
    "headless": false,
    "defaultTopic": "Logarithms"
}
```

| Setting | Description |
|---------|-------------|
| `browserPath` | Path to browser executable (auto-detected) |
| `userDataDir` | Browser profile directory (auto-detected) |
| `browserName` | Friendly name of selected browser |
| `practiceUrl` | Base URL for practice tests |
| `delayPerQuestion` | Wait time between questions (ms) |
| `questionsToAnswer` | How many questions to answer correctly |
| `questionsToSkip` | How many questions to skip at end |
| `matchingThreshold` | Similarity threshold for matching (0.0-1.0) |
| `headless` | Run browser without UI (true/false) |
| `defaultTopic` | Default topic on startup |

### Matching Algorithm
- **EXACT**: 100% match after normalization (best)
- **CONTAINS/CONTAINED**: One question contains the other (requires 50+ characters)
- **SIMILAR**: Uses `matchingThreshold` config (default 85%) combined score using:
  - Sequence matching (40% weight)
  - Bidirectional token overlap (60% weight)

### How to Run
1. Run `npm start`
2. On first run, **select your browser** from the auto-detected list
3. Use menu option **6** to change browser later, or **5** to edit other config
4. Press **1** to start automation
5. Watch as it auto-learns new questions!

### Data Format (answers.json)
```json
{
    "answers": [
        {
            "id": 1,
            "question": "Question text here...",
            "type": "mcq" or "type",
            "answer": "A" or "123"
        }
    ]
}
```

### Last Update
- Made all configuration editable via `config.json` file
- Added CLI menu option (5) to edit configuration interactively
- Configuration includes: browser path, delays, matching threshold, headless mode, default topic
