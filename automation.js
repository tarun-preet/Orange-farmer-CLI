const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Loaded from config.json
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Default configuration
const DEFAULT_CONFIG = {
    browserPath: '',
    userDataDir: '',
    browserName: '',
    practiceUrl: 'https://www.afterboards.in/practice?section=',
    delayPerQuestion: 3000,
    questionsToAnswer: 3,
    questionsToSkip: 2,
    matchingThreshold: 0.85,
    headless: false,
    defaultTopic: 'Logarithms'
};

// Load configuration from file
function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        // Create default config file
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4));
        console.log('Created default config.json file');
        return { ...DEFAULT_CONFIG };
    }

    try {
        const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        // Merge with defaults to ensure all keys exist
        return { ...DEFAULT_CONFIG, ...fileConfig };
    } catch (e) {
        console.error('Error reading config.json, using defaults:', e.message);
        return { ...DEFAULT_CONFIG };
    }
}

// Save configuration to file
function saveConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
}

// ═══════════════════════════════════════════════════════════════════════════
// BROWSER AUTO-DETECTION (runs once at startup, cached in memory)
// ═══════════════════════════════════════════════════════════════════════════
function detectBrowsers() {
    const platform = process.platform; // 'win32' or 'darwin'
    let candidates = [];

    if (platform === 'darwin') {
        // ── macOS ──
        const home = process.env.HOME || '';
        const appSupport = path.join(home, 'Library', 'Application Support');

        // Note: Chrome is excluded — remote debugging issues with default profile
        candidates = [
            {
                name: 'Brave',
                paths: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
                userDataDir: path.join(appSupport, 'BraveSoftware', 'Brave-Browser')
            },
            {
                name: 'Microsoft Edge',
                paths: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
                userDataDir: path.join(appSupport, 'Microsoft Edge')
            },
            {
                name: 'Chromium',
                paths: ['/Applications/Chromium.app/Contents/MacOS/Chromium'],
                userDataDir: path.join(appSupport, 'Chromium')
            },
            {
                name: 'Opera',
                paths: ['/Applications/Opera.app/Contents/MacOS/Opera'],
                userDataDir: path.join(appSupport, 'com.operasoftware.Opera')
            },
            {
                name: 'Vivaldi',
                paths: ['/Applications/Vivaldi.app/Contents/MacOS/Vivaldi'],
                userDataDir: path.join(appSupport, 'Vivaldi')
            }
        ];
    } else {
        // ── Windows ──
        const localAppData = process.env.LOCALAPPDATA || '';
        const programFilesX86 = process.env['PROGRAMFILES(X86)'] || process.env.PROGRAMFILES || '';
        const programFiles = process.env.PROGRAMFILES || '';
        const appData = process.env.APPDATA || '';

        // Note: Chrome is excluded — remote debugging rejects default profile
        candidates = [
            {
                name: 'Brave',
                paths: [
                    path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
                ],
                userDataDir: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data')
            },
            {
                name: 'Microsoft Edge',
                paths: [
                    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
                    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
                ],
                userDataDir: path.join(localAppData, 'Microsoft', 'Edge', 'User Data')
            },
            {
                name: 'Chromium',
                paths: [
                    path.join(localAppData, 'Chromium', 'Application', 'chrome.exe')
                ],
                userDataDir: path.join(localAppData, 'Chromium', 'User Data')
            },
            {
                name: 'Opera',
                paths: [
                    path.join(localAppData, 'Programs', 'Opera', 'opera.exe')
                ],
                userDataDir: path.join(appData, 'Opera Software', 'Opera Stable')
            },
            {
                name: 'Vivaldi',
                paths: [
                    path.join(localAppData, 'Vivaldi', 'Application', 'vivaldi.exe')
                ],
                userDataDir: path.join(localAppData, 'Vivaldi', 'User Data')
            }
        ];
    }

    const found = [];
    for (const browser of candidates) {
        for (const exePath of browser.paths) {
            if (fs.existsSync(exePath)) {
                found.push({
                    name: browser.name,
                    browserPath: exePath,
                    userDataDir: browser.userDataDir
                });
                break;
            }
        }
    }
    return found;
}

// Cache detected browsers once at startup
const DETECTED_BROWSERS = detectBrowsers();

const CONFIG = loadConfig();

// ═══════════════════════════════════════════════════════════════════════════
// CLI COLORS & STYLING
// ═══════════════════════════════════════════════════════════════════════════
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgRed: '\x1b[41m'
};

const c = colors;

// Logging helpers
const log = {
    info: (msg) => console.log(`${c.cyan}ℹ${c.reset} ${msg}`),
    success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
    warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
    error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
    question: (msg) => console.log(`${c.magenta}?${c.reset} ${msg}`),
    saved: (msg) => console.log(`${c.green}💾${c.reset} ${msg}`),
    learn: (msg) => console.log(`${c.cyan}🧠${c.reset} ${msg}`),
    cycle: (num) => console.log(`\n${c.bgBlue}${c.white}${c.bright}  CYCLE ${num}  ${c.reset}\n`),
    divider: () => console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`)
};

// Available topics (names must match what appears on afterboards.in)
const TOPICS = [
    { id: 1, name: 'Logarithms', selector: 'Logarithms' },
    { id: 2, name: 'Linear Equations', selector: 'Inequalities & Linear Equation' },
    { id: 3, name: 'Functions', selector: 'Functions' },
    { id: 4, name: 'Modulus', selector: 'Modulus' },
    { id: 5, name: 'Profit & Loss', selector: 'Profit & Loss' },
    { id: 6, name: 'Interest (SI/CI)', selector: 'Simple & Compound Interest' },
    { id: 7, name: 'Time & Work', selector: 'Time & Work' },
    { id: 8, name: 'Time Speed Distance', selector: 'Time, Speed & Distance' },
    { id: 9, name: 'Ratio & Proportion', selector: 'Ratio, Proportion & Variation' },
    { id: 10, name: 'Mixture & Alligation', selector: 'Mixture & Alligation' },
    { id: 11, name: 'Mean Median Mode', selector: 'Mean, Median & Mode' },
    { id: 12, name: 'Progression & Series', selector: 'Progression & Series' },
    { id: 13, name: 'Minima & Maxima', selector: 'Minima & Maxima' },
    { id: 14, name: 'Polynomials', selector: 'Polynomials & Identities' }
];

// Statistics tracking
const stats = {
    questionsAnswered: 0,
    correctMatches: 0,
    newLearned: 0,
    cyclesCompleted: 0
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════
function showBanner() {
    console.clear();
    const o = '\x1b[38;2;255;140;0m';
    const y = '\x1b[38;2;255;200;50m';
    const a = '\x1b[38;2;200;120;40m';
    const br = '\x1b[38;2;140;90;30m';
    const dm = '\x1b[38;2;160;130;80m';
    const r = c.reset;
    console.log(`
${br}  ╔${'═'.repeat(62)}╗${r}
${br}  ║${r}                                                              ${br}║${r}
${br}  ║${r}   ${o}${c.bright} ██████  ██████   █████  ██   ██  ██████  ███████${r}        ${br}║${r}
${br}  ║${r}   ${o}${c.bright}██    ██ ██   ██ ██   ██ ███  ██ ██       ██${r}             ${br}║${r}
${br}  ║${r}   ${y}${c.bright}██    ██ ██████  ███████ ██ █ ██ ██   ███ █████${r}          ${br}║${r}
${br}  ║${r}   ${y}${c.bright}██    ██ ██   ██ ██   ██ ██  ███ ██    ██ ██${r}             ${br}║${r}
${br}  ║${r}   ${a}${c.bright} ██████  ██   ██ ██   ██ ██   ██  ██████  ███████${r}        ${br}║${r}
${br}  ║${r}                                                              ${br}║${r}
${br}  ║${r}   ${o}${c.bright}███████  █████  ██████  ██   ██ ███████ ██████${r}          ${br}║${r}
${br}  ║${r}   ${o}${c.bright}██      ██   ██ ██   ██ ███ ███ ██      ██   ██${r}         ${br}║${r}
${br}  ║${r}   ${y}${c.bright}█████   ███████ ██████  ██ █ ██ █████   ██████${r}          ${br}║${r}
${br}  ║${r}   ${y}${c.bright}██      ██   ██ ██   ██ ██   ██ ██      ██   ██${r}         ${br}║${r}
${br}  ║${r}   ${a}${c.bright}██      ██   ██ ██   ██ ██   ██ ███████ ██   ██${r}         ${br}║${r}
${br}  ║${r}                                                              ${br}║${r}
${br}  ║${r}            ${dm}v1.0.0  ·  harvest season${r}                        ${br}║${r}
${br}  ║${r}                                                              ${br}║${r}
${br}  ╚${'═'.repeat(62)}╝${r}
${c.dim}  by ${c.magenta}apartment firm${r}
${c.dim}  Afterboards.in Auto-Learning Practice Bot${r}
`);
}

function showMenu() {
    console.log(`
${c.bright}${c.white}  MAIN MENU${c.reset}
${c.dim}───────────────────────────────────────${c.reset}
  ${c.green}1${c.reset}) Start Automation
  ${c.cyan}2${c.reset}) Select Topic
  ${c.yellow}3${c.reset}) View Statistics
  ${c.magenta}4${c.reset}) View Configuration
  ${c.blue}5${c.reset}) Edit Configuration
  ${c.white}6${c.reset}) Select Browser
  ${c.yellow}7${c.reset}) Reset Database
  ${c.red}8${c.reset}) Exit
${c.dim}───────────────────────────────────────${c.reset}
`);
}

function showTopicMenu() {
    console.log(`\n${c.bright}${c.white}  SELECT TOPIC${c.reset}`);
    console.log(`${c.dim}───────────────────────────────────────${c.reset}`);
    TOPICS.forEach(t => {
        console.log(`  ${c.green}${t.id.toString().padStart(2)}${c.reset}) ${t.name}`);
    });
    console.log(`${c.dim}───────────────────────────────────────${c.reset}\n`);
}

function showStats() {
    const answers = loadAnswers();
    console.log(`
${c.bright}${c.white}  STATISTICS${c.reset}
${c.dim}───────────────────────────────────────${c.reset}
  ${c.cyan}Questions in Database:${c.reset}  ${answers.length}
  ${c.green}Questions Answered:${c.reset}     ${stats.questionsAnswered}
  ${c.yellow}Correct Matches:${c.reset}        ${stats.correctMatches}
  ${c.magenta}New Q&A Learned:${c.reset}        ${stats.newLearned}
  ${c.blue}Cycles Completed:${c.reset}       ${stats.cyclesCompleted}
${c.dim}───────────────────────────────────────${c.reset}
`);
}

function showConfig() {
    const browserLabel = CONFIG.browserName ? `${c.cyan}${CONFIG.browserName}${c.reset}` : `${c.dim}(unknown)${c.reset}`;
    console.log(`
${c.bright}${c.white}  CONFIGURATION${c.reset}  ${c.dim}(edit: config.json)${c.reset}
${c.dim}═══════════════════════════════════════════════════════════════${c.reset}
  ${c.bright}Browser Settings${c.reset}
  ${c.cyan}Browser:${c.reset}               ${browserLabel}
  ${c.cyan}1. browserPath:${c.reset}        ${c.dim}${CONFIG.browserPath}${c.reset}
  ${c.cyan}2. userDataDir:${c.reset}        ${c.dim}${CONFIG.userDataDir}${c.reset}
  ${c.cyan}3. headless:${c.reset}           ${CONFIG.headless ? c.green + 'true' : c.yellow + 'false'}${c.reset}

  ${c.bright}Automation Settings${c.reset}
  ${c.cyan}4. delayPerQuestion:${c.reset}   ${c.yellow}${CONFIG.delayPerQuestion}${c.reset} ms
  ${c.cyan}5. questionsToAnswer:${c.reset}  ${c.green}${CONFIG.questionsToAnswer}${c.reset} questions
  ${c.cyan}6. questionsToSkip:${c.reset}    ${c.red}${CONFIG.questionsToSkip}${c.reset} questions

  ${c.bright}Matching Settings${c.reset}
  ${c.cyan}7. matchingThreshold:${c.reset}  ${c.magenta}${(CONFIG.matchingThreshold * 100).toFixed(0)}%${c.reset}

  ${c.bright}Defaults${c.reset}
  ${c.cyan}8. defaultTopic:${c.reset}       ${c.cyan}${CONFIG.defaultTopic}${c.reset}
  ${c.cyan}9. practiceUrl:${c.reset}        ${c.dim}${CONFIG.practiceUrl}${c.reset}
${c.dim}═══════════════════════════════════════════════════════════════${c.reset}
`);
}

async function editConfig() {
    while (true) {
        showConfig();
        console.log(`
${c.bright}${c.white}  EDIT CONFIGURATION${c.reset}
${c.dim}───────────────────────────────────────${c.reset}
  Enter a number (1-9) to edit that setting
  Enter ${c.yellow}0${c.reset} to go back to main menu
${c.dim}───────────────────────────────────────${c.reset}
`);

        const choice = await prompt('Select setting to edit (0-9): ');

        if (choice === '0') break;

        let newValue;
        switch (choice) {
            case '1':
            case '2':
                await selectBrowser();
                break;
            case '3':
                newValue = await prompt(`Headless mode (true/false) [${CONFIG.headless}]: `);
                if (newValue) CONFIG.headless = newValue.toLowerCase() === 'true';
                break;
            case '4':
                newValue = await prompt(`Delay per question in ms [${CONFIG.delayPerQuestion}]: `);
                if (newValue) CONFIG.delayPerQuestion = parseInt(newValue) || CONFIG.delayPerQuestion;
                break;
            case '5':
                newValue = await prompt(`Questions to answer first [${CONFIG.questionsToAnswer}]: `);
                if (newValue) CONFIG.questionsToAnswer = parseInt(newValue) || CONFIG.questionsToAnswer;
                break;
            case '6':
                newValue = await prompt(`Questions to skip at end [${CONFIG.questionsToSkip}]: `);
                if (newValue) CONFIG.questionsToSkip = parseInt(newValue) || CONFIG.questionsToSkip;
                break;
            case '7':
                newValue = await prompt(`Matching threshold (0.0-1.0) [${CONFIG.matchingThreshold}]: `);
                if (newValue) {
                    const val = parseFloat(newValue);
                    if (val >= 0 && val <= 1) CONFIG.matchingThreshold = val;
                }
                break;
            case '8':
                showTopicMenu();
                newValue = await prompt(`Default topic name [${CONFIG.defaultTopic}]: `);
                if (newValue) CONFIG.defaultTopic = newValue;
                break;
            case '9':
                newValue = await prompt(`Practice URL [${CONFIG.practiceUrl}]: `);
                if (newValue) CONFIG.practiceUrl = newValue;
                break;
            default:
                log.error('Invalid option');
                continue;
        }

        // Save to file
        saveConfig(CONFIG);
        log.success('Configuration saved to config.json');
    }
}

async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(`${c.yellow}>${c.reset} ${question}`, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// BROWSER SELECTION (uses prompt + colors, must be defined after them)
// ═══════════════════════════════════════════════════════════════════════════
async function selectBrowser() {
    if (DETECTED_BROWSERS.length === 0) {
        console.log(`\n${c.yellow}⚠ No browsers detected automatically.${c.reset}`);
        const customPath = await prompt('Enter browser executable path: ');
        if (customPath) {
            CONFIG.browserPath = customPath;
            const customData = await prompt('Enter user data directory: ');
            if (customData) CONFIG.userDataDir = customData;
            CONFIG.browserName = 'Custom';
            saveConfig(CONFIG);
            log.success('Browser configured manually.');
        }
        return;
    }

    console.log(`\n${c.bright}${c.white}  DETECTED BROWSERS${c.reset}`);
    console.log(`${c.dim}───────────────────────────────────────${c.reset}`);
    DETECTED_BROWSERS.forEach((b, i) => {
        const current = (b.browserPath === CONFIG.browserPath) ? ` ${c.green}← current${c.reset}` : '';
        console.log(`  ${c.green}${i + 1}${c.reset}) ${b.name}${current}`);
        console.log(`     ${c.dim}${b.browserPath}${c.reset}`);
    });
    console.log(`  ${c.yellow}${DETECTED_BROWSERS.length + 1}${c.reset}) Custom path (enter manually)`);
    console.log(`${c.dim}───────────────────────────────────────${c.reset}\n`);

    const choice = await prompt(`Select browser (1-${DETECTED_BROWSERS.length + 1}): `);
    const num = parseInt(choice);

    if (num >= 1 && num <= DETECTED_BROWSERS.length) {
        const selected = DETECTED_BROWSERS[num - 1];
        CONFIG.browserPath = selected.browserPath;
        CONFIG.userDataDir = selected.userDataDir;
        CONFIG.browserName = selected.name;
        saveConfig(CONFIG);
        log.success(`Browser set to ${c.cyan}${selected.name}${c.reset}`);
    } else if (num === DETECTED_BROWSERS.length + 1) {
        const customPath = await prompt('Enter browser executable path: ');
        if (customPath) {
            // Block Chrome on both Windows and Mac
            const baseName = path.basename(customPath).toLowerCase();
            if (baseName === 'chrome.exe' || baseName === 'google chrome') {
                log.error('Google Chrome is not supported due to remote debugging restrictions.');
                log.info(`Use ${c.cyan}Brave${c.reset}, ${c.cyan}Edge${c.reset}, or another Chromium browser instead.`);
                return;
            }
            CONFIG.browserPath = customPath;
            const customData = await prompt('Enter user data directory: ');
            if (customData) CONFIG.userDataDir = customData;
            CONFIG.browserName = 'Custom';
            saveConfig(CONFIG);
            log.success('Browser configured manually.');
        }
    } else {
        log.error('Invalid selection.');
    }
}

// Selected topic (default from config)
let selectedTopic = TOPICS.find(t => t.name === CONFIG.defaultTopic) || TOPICS[0];

async function runCLI() {
    // Auto-prompt browser selection on first run or if configured browser is missing
    if (!fs.existsSync(CONFIG.browserPath)) {
        console.log(`\n${c.yellow}${c.bright}⚠ Browser not found at:${c.reset} ${c.dim}${CONFIG.browserPath}${c.reset}`);
        console.log(`${c.cyan}Let's set up your browser — this only happens once.${c.reset}`);
        await selectBrowser();
    }

    showBanner();

    while (true) {
        console.log(`${c.dim}Current Topic: ${c.cyan}${selectedTopic.name}${c.reset}\n`);
        showMenu();

        const choice = await prompt('Select option (1-8): ');

        switch (choice) {
            case '1':
                await startAutomation();
                break;
            case '2':
                showTopicMenu();
                const topicChoice = await prompt(`Select topic (1-${TOPICS.length}): `);
                const topicNum = parseInt(topicChoice);
                if (topicNum >= 1 && topicNum <= TOPICS.length) {
                    selectedTopic = TOPICS[topicNum - 1];
                    log.success(`Selected topic: ${selectedTopic.name}`);
                } else {
                    log.error('Invalid selection');
                }
                break;
            case '3':
                showStats();
                await prompt('Press Enter to continue...');
                break;
            case '4':
                showConfig();
                await prompt('Press Enter to continue...');
                break;
            case '5':
                await editConfig();
                break;
            case '6':
                await selectBrowser();
                break;
            case '7': {
                const confirm = await prompt(`${c.red}Are you sure? This will delete ALL learned answers. (yes/no): ${c.reset}`);
                if (confirm.toLowerCase() === 'yes') {
                    const answersPath = path.join(__dirname, 'answers.json');
                    fs.writeFileSync(answersPath, JSON.stringify({ answers: [] }, null, 4));
                    stats.questionsAnswered = 0;
                    stats.correctMatches = 0;
                    stats.newLearned = 0;
                    stats.cyclesCompleted = 0;
                    log.success('Database has been reset.');
                } else {
                    log.info('Reset cancelled.');
                }
                await prompt('Press Enter to continue...');
                break;
            }
            case '8':
                console.log(`\n${c.yellow}👋 Goodbye!${c.reset}\n`);
                process.exit(0);
            default:
                log.error('Invalid option. Please select 1-8.');
        }

        showBanner();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CONSTANTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════
const BRAVE_PATH = CONFIG.browserPath;
const PRACTICE_URL = CONFIG.practiceUrl;
const DELAY_PER_QUESTION = CONFIG.delayPerQuestion;
const QUESTIONS_TO_ANSWER = CONFIG.questionsToAnswer;
const QUESTIONS_TO_SKIP = CONFIG.questionsToSkip;

// Get the next ID for a new question
function getNextId(answers) {
    let maxId = 0;
    for (const entry of answers) {
        if (entry.id && entry.id > maxId) {
            maxId = entry.id;
        }
    }
    return maxId + 1;
}

function loadAnswers() {
    const answersPath = path.join(__dirname, 'answers.json');
    if (!fs.existsSync(answersPath)) {
        // Create empty answers file if it doesn't exist
        fs.writeFileSync(answersPath, JSON.stringify({ answers: [] }, null, 4));
        console.log('Created new answers.json file');
        return [];
    }

    let data = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

    // Migrate existing questions that don't have IDs
    let needsSave = false;
    let nextId = 1;
    for (const entry of data.answers) {
        if (!entry.id) {
            entry.id = nextId;
            needsSave = true;
        }
        if (entry.id >= nextId) nextId = entry.id + 1;
    }

    if (needsSave) {
        fs.writeFileSync(answersPath, JSON.stringify(data, null, 4));
        log.info(`Migrated ${data.answers.length} questions with unique IDs`);
    }

    return data.answers;
}

function saveAnswer(questionText, questionType, correctAnswer) {
    const answersPath = path.join(__dirname, 'answers.json');
    let data = { answers: [] };

    if (fs.existsSync(answersPath)) {
        data = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
    }

    // Normalize question text for comparison
    const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedNew = normalize(questionText);

    // Check if this question already exists (avoid duplicates)
    const exists = data.answers.some(entry => {
        const normalizedExisting = normalize(entry.question);
        // Check if questions are very similar (>80% token overlap)
        const newTokens = new Set(normalizedNew.split(' ').filter(w => w.length > 1));
        const existingTokens = normalizedExisting.split(' ').filter(w => w.length > 1);
        if (existingTokens.length === 0) return false;

        let matchCount = 0;
        for (const token of existingTokens) {
            if (newTokens.has(token)) matchCount++;
        }
        return matchCount / existingTokens.length > 0.8;
    });

    if (exists) {
        log.info('Question already in database, skipping');
        return false;
    }

    // Get next ID
    const id = getNextId(data.answers);

    // Add new question-answer pair with ID
    const newEntry = {
        id: id,
        question: questionText.substring(0, 200), // Limit length
        type: questionType,
        answer: correctAnswer
    };

    data.answers.push(newEntry);
    fs.writeFileSync(answersPath, JSON.stringify(data, null, 4));
    stats.newLearned++;
    log.saved(`${c.green}NEW${c.reset} [${c.cyan}#${id}${c.reset}]: "${questionText.substring(0, 35)}..." → ${c.bright}${correctAnswer}${c.reset}`);
    return true;
}

function findAnswer(questionText, answers) {
    // Normalize text for comparison - remove special chars and extra spaces
    const normalize = (text) => text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim();

    const normalizedQuestion = normalize(questionText);

    // STAGE 1: Try exact match first (most accurate)
    for (const entry of answers) {
        const normalizedEntry = normalize(entry.question);
        if (normalizedQuestion === normalizedEntry) {
            stats.correctMatches++;
            const idStr = entry.id ? `[${c.cyan}#${entry.id}${c.reset}] ` : '';
            log.success(`${c.green}EXACT${c.reset} ${idStr}match: "${entry.question.substring(0, 30)}..."`);
            return entry;
        }
    }

    // STAGE 2: Check if normalized question CONTAINS or IS CONTAINED in an entry
    // This handles cases where the scraped text has extra content
    // Increased minimum length to 50 for more reliable containment matching
    for (const entry of answers) {
        const normalizedEntry = normalize(entry.question);
        const idStr = entry.id ? `[${c.cyan}#${entry.id}${c.reset}] ` : '';

        // Check containment in both directions - require longer strings for safety
        if (normalizedQuestion.includes(normalizedEntry) && normalizedEntry.length > 50) {
            stats.correctMatches++;
            log.success(`${c.cyan}CONTAINS${c.reset} ${idStr}match: "${entry.question.substring(0, 30)}..."`);
            return entry;
        }
        if (normalizedEntry.includes(normalizedQuestion) && normalizedQuestion.length > 50) {
            stats.correctMatches++;
            log.success(`${c.cyan}CONTAINED${c.reset} ${idStr}match: "${entry.question.substring(0, 30)}..."`);
            return entry;
        }
    }

    // STAGE 3: Substring similarity - find longest common substring ratio
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of answers) {
        const normalizedEntry = normalize(entry.question);

        // Calculate similarity using longest common subsequence approach
        const shorter = normalizedQuestion.length < normalizedEntry.length ? normalizedQuestion : normalizedEntry;
        const longer = normalizedQuestion.length >= normalizedEntry.length ? normalizedQuestion : normalizedEntry;

        // Simple but effective: count matching character sequences
        let matchingChars = 0;
        let i = 0, j = 0;
        while (i < shorter.length && j < longer.length) {
            if (shorter[i] === longer[j]) {
                matchingChars++;
                i++;
                j++;
            } else {
                j++;
            }
        }

        // Score based on how much of the shorter string was found in order
        const sequenceScore = matchingChars / shorter.length;

        // Also check token overlap (bidirectional)
        const questionTokens = normalizedQuestion.split(' ').filter(t => t.length > 2);
        const entryTokens = normalizedEntry.split(' ').filter(t => t.length > 2);

        if (entryTokens.length === 0 || questionTokens.length === 0) continue;

        // How many entry tokens are in question?
        const entryInQuestion = entryTokens.filter(t => normalizedQuestion.includes(t)).length / entryTokens.length;
        // How many question tokens are in entry?
        const questionInEntry = questionTokens.filter(t => normalizedEntry.includes(t)).length / questionTokens.length;

        // Combined score: sequence match + bidirectional token overlap
        const combinedScore = (sequenceScore * 0.4) + (entryInQuestion * 0.3) + (questionInEntry * 0.3);

        // Only show candidates above 90% in debug output (reduced noise)
        if (combinedScore > 0.90) {
            const idStr = entry.id ? `[#${entry.id}] ` : '';
            console.log(`${c.dim}  Candidate: ${idStr}"${entry.question.substring(0, 25)}..." ${(combinedScore * 100).toFixed(0)}%${c.reset}`);
        }

        if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestMatch = entry;
        }
    }

    // Only accept high-confidence matches (above configured threshold)
    if (bestScore > CONFIG.matchingThreshold) {
        stats.correctMatches++;
        const idStr = bestMatch.id ? `[${c.cyan}#${bestMatch.id}${c.reset}] ` : '';
        log.success(`${c.yellow}SIMILAR${c.reset} ${idStr}(${(bestScore * 100).toFixed(0)}%): "${bestMatch.question.substring(0, 25)}..."`);
        return bestMatch;
    }

    log.warn(`No confident match (best: ${(bestScore * 100).toFixed(0)}%, required: ${(CONFIG.matchingThreshold * 100).toFixed(0)}%+)`);
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE AUTOMATION DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
const dashState = {
    cycles: 0,
    answered: 0,
    skipped: 0,
    currentQ: 0,
    totalQ: 5,
    lastHit: null,
    status: 'Idle',
    drawn: false,
    startTime: null,
    timeLimitMs: 0,   // 0 = unlimited
    killed: false      // set to true to break out of main loop
};

function formatElapsed(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function renderDashboard() {
    const W = 50; // inner width of box
    const o = '\x1b[38;2;255;140;0m';
    const y = '\x1b[38;2;255;200;50m';
    const br = '\x1b[38;2;140;90;30m';
    const dm = '\x1b[38;2;160;130;80m';
    const r = c.reset;

    // Helper: pad a visible string to exact width (ignoring ANSI codes)
    const pad = (str, len) => {
        const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
        const diff = Math.max(0, len - visible.length);
        return str + ' '.repeat(diff);
    };

    // Elapsed time
    const elapsed = dashState.startTime ? Date.now() - dashState.startTime : 0;
    const elapsedStr = formatElapsed(elapsed);
    const timeLimit = dashState.timeLimitMs > 0
        ? ` / ${formatElapsed(dashState.timeLimitMs)}`
        : '';

    // Progress bar for question (1-5)
    const barLen = 20;
    const filled = Math.round((dashState.currentQ / dashState.totalQ) * barLen);
    const empty = barLen - filled;
    const qBar = `${c.green}${'\u2588'.repeat(filled)}${c.dim}${'\u2591'.repeat(empty)}${r}`;
    const qText = `${dashState.currentQ}/${dashState.totalQ}`;

    // Database hit/miss
    let dbText;
    if (dashState.lastHit === null) {
        dbText = `${c.dim}---${r}`;
    } else if (dashState.lastHit) {
        dbText = `${c.green}\u2713 HIT${r}`;
    } else {
        dbText = `${c.red}\u2717 MISS${r}`;
    }

    // Build rows with exact padding
    const titleRow = pad(`  ${o}${c.bright}\ud83c\udf4a ORANGE FARMER${r} ${dm}\u2014 ${dashState.status}${r}`, W);
    const cyclesRow = pad(`  ${y}Cycles:${r}    ${c.bright}${dashState.cycles}${r}`, W);
    const answeredRow = pad(`  ${y}Answered:${r}  ${c.bright}${dashState.answered}${r}`, W);
    const skippedRow = pad(`  ${y}Skipped:${r}   ${c.bright}${dashState.skipped}${r}`, W);
    const timeRow = pad(`  ${y}Runtime:${r}   ${c.bright}${elapsedStr}${timeLimit}${r}`, W);
    const qRow = pad(`  ${y}Question:${r}  [${qBar}] ${qText}`, W);
    const dbRow = pad(`  ${y}Database:${r}  ${dbText}`, W);
    const hintRow = pad(`  ${dm}Press ${c.bright}Q${r}${dm} to stop and return to menu${r}`, W);

    const lines = [
        `${br}\u2554${'\u2550'.repeat(W)}\u2557${r}`,
        `${br}\u2551${r}${titleRow}${br}\u2551${r}`,
        `${br}\u2560${'\u2550'.repeat(W)}\u2563${r}`,
        `${br}\u2551${r}${cyclesRow}${br}\u2551${r}`,
        `${br}\u2551${r}${answeredRow}${br}\u2551${r}`,
        `${br}\u2551${r}${skippedRow}${br}\u2551${r}`,
        `${br}\u2551${r}${timeRow}${br}\u2551${r}`,
        `${br}\u2551${r}${' '.repeat(W)}${br}\u2551${r}`,
        `${br}\u2551${r}${qRow}${br}\u2551${r}`,
        `${br}\u2551${r}${dbRow}${br}\u2551${r}`,
        `${br}\u2551${r}${' '.repeat(W)}${br}\u2551${r}`,
        `${br}\u2551${r}${hintRow}${br}\u2551${r}`,
        `${br}\u255a${'\u2550'.repeat(W)}\u255d${r}`
    ];

    if (dashState.drawn) {
        process.stdout.write(`\x1b[${lines.length}A`);
    }
    process.stdout.write(lines.join('\n') + '\n');
    dashState.drawn = true;
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Kill all processes of the configured browser before launching automation
function killBrowserProcesses() {
    const exeName = path.basename(CONFIG.browserPath).toLowerCase();

    try {
        if (process.platform === 'darwin') {
            // macOS: use pkill with the browser name
            const macProcessMap = {
                'brave browser': 'Brave Browser',
                'microsoft edge': 'Microsoft Edge',
                'chromium': 'Chromium',
                'opera': 'Opera',
                'vivaldi': 'Vivaldi'
            };
            const processName = macProcessMap[(CONFIG.browserName || '').toLowerCase()] || CONFIG.browserName || exeName;
            execSync(`pkill -f "${processName}"`, { stdio: 'ignore' });
        } else {
            // Windows: use taskkill
            const winProcessMap = {
                'brave.exe': 'brave.exe',
                'msedge.exe': 'msedge.exe',
                'opera.exe': 'opera.exe',
                'vivaldi.exe': 'vivaldi.exe'
            };
            const processName = winProcessMap[exeName] || exeName;
            execSync(`taskkill /F /IM ${processName} /T`, { stdio: 'ignore' });
        }
        log.success(`Closed all ${CONFIG.browserName || exeName} processes`);
    } catch (e) {
        // No processes were running — that's fine
        log.info(`No existing ${CONFIG.browserName || exeName} processes found`);
    }
}

async function startAutomation() {
    const answers = loadAnswers();
    log.info(`Loaded ${c.bright}${answers.length}${c.reset} answers from database`);

    log.divider();
    log.info(`Browser: ${c.cyan}${CONFIG.browserName || 'Unknown'}${c.reset}`);
    log.info(`Topic: ${c.cyan}${c.bright}${selectedTopic.name}${c.reset}`);
    log.divider();

    await prompt('Press Enter to launch browser...');

    // Ask for time limit
    const timeInput = await prompt(`Run for how many minutes? (0 = unlimited): `);
    const timeMins = parseInt(timeInput) || 0;
    dashState.timeLimitMs = timeMins > 0 ? timeMins * 60 * 1000 : 0;
    dashState.startTime = Date.now();
    dashState.killed = false;
    dashState.cycles = 0;
    dashState.answered = 0;
    dashState.skipped = 0;

    // Kill existing browser processes to avoid profile lock conflicts
    killBrowserProcesses();

    log.info('Launching browser...');
    const browser = await puppeteer.launch({
        executablePath: CONFIG.browserPath,
        headless: CONFIG.headless,
        defaultViewport: null,
        userDataDir: CONFIG.userDataDir,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        log.info('Navigating to practice page...');
        await page.goto(PRACTICE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(3000);

        // STEP 1: Click on "Topic Wise Tests" first
        log.info('Step 1: Looking for Topic Wise Tests...');
        await page.evaluate(() => window.scrollBy(0, 300));
        await wait(1000);

        await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            for (const el of allElements) {
                const text = el.textContent?.trim() || '';
                if (text === 'Topic Wise Tests') {
                    el.click();
                    return true;
                }
            }
            // Try clicking elements that contain "Topic Wise"
            for (const el of allElements) {
                if (el.textContent?.includes('Topic Wise') && el.textContent?.length < 50) {
                    el.click();
                    return true;
                }
            }
            return false;
        });

        log.success('Clicked Topic Wise Tests');
        await wait(2000);

        // STEP 2: Now click on "IPMAT Indore"
        log.info('Step 2: Looking for IPMAT Indore...');
        await page.evaluate(() => window.scrollBy(0, 200));
        await wait(500);

        await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            // Look for exact match first
            for (const el of allElements) {
                const text = el.textContent?.trim() || '';
                if (text === 'IPMAT Indore') {
                    el.click();
                    return true;
                }
            }
            // Then partial match
            for (const el of allElements) {
                const text = el.textContent?.trim() || '';
                if (text.includes('IPMAT') && text.includes('Indore') && text.length < 50) {
                    el.click();
                    return true;
                }
            }
            return false;
        });

        log.success('Clicked IPMAT Indore');
        await wait(3000); // Wait for topics to load

        // Scroll down to see topics
        // Scroll through the page to load all topics
        await page.evaluate(() => window.scrollBy(0, 400));
        await wait(1000);
        await page.evaluate(() => window.scrollBy(0, 400));
        await wait(1000);
        await page.evaluate(() => window.scrollBy(0, 400));
        await wait(500);
        // Scroll back up a bit
        await page.evaluate(() => window.scrollTo(0, 300));
        await wait(500);

        // STEP 3: Now look for the specific topic
        log.info(`Step 3: Looking for ${c.cyan}${selectedTopic.name}${c.reset} topic...`);

        // Debug: List all elements that have a "Practice" button nearby
        const pageTopics = await page.evaluate(() => {
            const results = [];
            // Find all Practice buttons and get their nearby text
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent?.trim() === 'Practice') {
                    // Get text from nearby elements
                    let parent = btn.parentElement;
                    for (let i = 0; i < 5 && parent; i++) {
                        const text = parent.textContent?.trim() || '';
                        // Extract just the topic name (before "Practice")
                        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
                        for (const line of lines) {
                            if (line !== 'Practice' && !results.includes(line)) {
                                results.push(line);
                            }
                        }
                        parent = parent.parentElement;
                    }
                }
            }
            return results.slice(0, 20);
        });



        // Try to click the selected topic
        const clicked = await page.evaluate((topicName) => {
            // Strategy 1: Find exact text match first
            const allElements = Array.from(document.querySelectorAll('*'));
            for (const el of allElements) {
                const text = el.textContent?.trim() || '';
                if (text === topicName || text.toLowerCase() === topicName.toLowerCase()) {
                    // Look for button in parent hierarchy
                    let parent = el.parentElement;
                    for (let i = 0; i < 8 && parent; i++) {
                        const btn = parent.querySelector('button');
                        if (btn) {
                            btn.click();
                            return { success: true, method: 'exact', btnText: btn.textContent?.trim() };
                        }
                        parent = parent.parentElement;
                    }
                }
            }

            // Strategy 2: Partial match
            for (const el of allElements) {
                const text = el.textContent?.trim() || '';
                if (text.includes(topicName) && text.length < 100) {
                    let parent = el.parentElement;
                    for (let i = 0; i < 8 && parent; i++) {
                        const btn = parent.querySelector('button');
                        if (btn) {
                            btn.click();
                            return { success: true, method: 'partial', btnText: btn.textContent?.trim() };
                        }
                        parent = parent.parentElement;
                    }
                }
            }

            // Strategy 3: Case-insensitive search
            const lowerTopic = topicName.toLowerCase();
            for (const el of allElements) {
                const text = (el.textContent?.trim() || '').toLowerCase();
                if (text.includes(lowerTopic) && text.length < 100) {
                    let parent = el.parentElement;
                    for (let i = 0; i < 8 && parent; i++) {
                        const btn = parent.querySelector('button');
                        if (btn) {
                            btn.click();
                            return { success: true, method: 'case-insensitive', btnText: btn.textContent?.trim() };
                        }
                        parent = parent.parentElement;
                    }
                }
            }

            return { success: false };
        }, selectedTopic.selector);

        if (clicked.success) {
            log.success(`Selected ${selectedTopic.name} (${clicked.method}, button: "${clicked.btnText}")`);
        } else {
            log.error(`Could not find topic "${selectedTopic.name}" on the page!`);
            log.warn('Try selecting a different topic or check if the name matches exactly.');
            await prompt('Press Enter to continue anyway...');
        }
        await wait(4000);

        // Main loop — dashboard replaces verbose output
        console.clear();
        dashState.status = 'Running';
        dashState.drawn = false;
        dashState.startTime = Date.now();

        // Keypress listener: press Q to stop
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', (key) => {
                if (key.toString().toLowerCase() === 'q') {
                    dashState.killed = true;
                    dashState.status = 'Stopping...';
                    renderDashboard();
                }
                // Ctrl+C
                if (key[0] === 3) process.exit(0);
            });
        }

        renderDashboard();

        let cycleCount = 0;
        while (true) {
            // Check kill flag
            if (dashState.killed) break;
            // Check time limit
            if (dashState.timeLimitMs > 0 && (Date.now() - dashState.startTime) >= dashState.timeLimitMs) {
                dashState.status = 'Time\'s up!';
                renderDashboard();
                break;
            }

            cycleCount++;
            stats.cyclesCompleted = cycleCount;
            dashState.cycles = cycleCount;
            dashState.currentQ = 0;
            dashState.lastHit = null;
            renderDashboard();

            // Reload answers every cycle to pick up changes
            const answers = loadAnswers();

            for (let q = 1; q <= 5; q++) {
                if (dashState.killed) break;
                if (dashState.timeLimitMs > 0 && (Date.now() - dashState.startTime) >= dashState.timeLimitMs) {
                    dashState.killed = true;
                    dashState.status = 'Time\'s up!';
                    renderDashboard();
                    break;
                }

                dashState.currentQ = q;
                renderDashboard();
                await wait(DELAY_PER_QUESTION);

                // Get question text
                const questionText = await page.evaluate(() => {
                    const paragraphs = document.querySelectorAll('p');
                    for (let i = 6; i < paragraphs.length; i++) {
                        const p = paragraphs[i];
                        const text = p.textContent.trim();
                        if (text.length > 20 && !text.includes('Modern Math') && !text.includes('Question')) {
                            return text;
                        }
                    }
                    return '';
                });


                // Detect question type based on presence of numpad
                const hasNumpad = await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button');
                    return Array.from(buttons).some(b =>
                        b.textContent.trim() === 'Clear All' ||
                        (b.className.includes('m-1') && b.className.includes('w-1/3'))
                    );
                });

                const questionType = hasNumpad ? 'type' : 'mcq';

                // Determine the answer to use
                let answerToUse = null;

                if (q <= QUESTIONS_TO_ANSWER) {
                    stats.questionsAnswered++;
                    dashState.answered = stats.questionsAnswered;
                    renderDashboard();

                    // Try to find matching answer
                    answerToUse = findAnswer(questionText, answers);

                    if (!answerToUse) {
                        // No match - use random answer
                        dashState.lastHit = false;
                        renderDashboard();
                        if (questionType === 'mcq') {
                            const randomOptions = ['A', 'B', 'C', 'D'];
                            answerToUse = { type: 'mcq', answer: randomOptions[Math.floor(Math.random() * 4)] };
                        } else {
                            answerToUse = { type: 'type', answer: '1' };
                        }
                    } else {
                        dashState.lastHit = true;
                        renderDashboard();
                    }

                    // Execute the answer
                    if (questionType === 'type') {
                        // Type using numpad
                        const answerStr = answerToUse.answer.toString();


                        // Clear first
                        await page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            const clearBtn = buttons.find(b => b.textContent.trim() === 'Clear All');
                            if (clearBtn) clearBtn.click();
                        });
                        await wait(200);

                        for (const digit of answerStr) {
                            await page.evaluate((d) => {
                                const buttons = Array.from(document.querySelectorAll('button'));
                                const numBtn = buttons.find(b => {
                                    const text = b.textContent.trim();
                                    return text === d && b.className.includes('m-1') && b.className.includes('w-1/3');
                                });
                                if (numBtn) numBtn.click();
                            }, digit);
                            await wait(200);
                        }


                    } else {
                        // MCQ - find and click options
                        const answerVal = answerToUse.answer.toString().trim();
                        // Handle numeric answers that should be A/B/C/D mapping? 
                        // Assuming answer should be A, B, C, D. If it's "1", "2"... convert?
                        // For now just stricter logging.

                        const optionLetter = answerVal.charAt(0).toUpperCase();
                        const optionIndex = optionLetter.charCodeAt(0) - 65;



                        // Debug: Find ALL potential option elements
                        const debug = await page.evaluate(() => {
                            const results = [];

                            // Check for radio inputs
                            const radios = document.querySelectorAll('input[type="radio"]');
                            results.push({ type: 'radios', count: radios.length });

                            // Check for labels
                            const labels = document.querySelectorAll('label');
                            labels.forEach(l => {
                                const rect = l.getBoundingClientRect();
                                if (rect.top > 300 && rect.top < 700) {
                                    results.push({ type: 'label', text: l.textContent.trim().substring(0, 30), top: Math.round(rect.top) });
                                }
                            });

                            // Check all divs in question area
                            const divs = document.querySelectorAll('div');
                            divs.forEach(d => {
                                const rect = d.getBoundingClientRect();
                                const text = d.textContent.trim();
                                // Look for option-sized divs with short text (likely answer options)
                                if (rect.top > 350 && rect.top < 650 &&
                                    rect.height > 20 && rect.height < 80 &&
                                    text.length > 0 && text.length < 30 &&
                                    !text.includes('Submit') && !text.includes('Next') &&
                                    !text.includes('Report') && !text.includes('Doubt')) {
                                    results.push({
                                        type: 'div',
                                        text: text.substring(0, 20),
                                        top: Math.round(rect.top),
                                        height: Math.round(rect.height),
                                        class: d.className.substring(0, 30)
                                    });
                                }
                            });

                            return results;
                        });


                        // Click the option - try multiple strategies
                        const clicked = await page.evaluate((idx) => {
                            // Strategy 1: Radio inputs
                            const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
                            if (radios.length >= 4) {
                                if (radios[idx]) {
                                    radios[idx].click();
                                    return { success: true, method: 'radio', index: idx };
                                }
                            }

                            // Strategy 2: Labels
                            const labels = Array.from(document.querySelectorAll('label'));
                            const optionLabels = labels.filter(l => {
                                const rect = l.getBoundingClientRect();
                                return rect.top > 300 && rect.top < 700;
                            });
                            if (optionLabels.length >= 4) {
                                if (optionLabels[idx]) {
                                    optionLabels[idx].click();
                                    return { success: true, method: 'label', text: optionLabels[idx].textContent.trim().substring(0, 20) };
                                }
                            }

                            // Strategy 3: Find divs that look like options (contain numbers or short text)
                            const allDivs = Array.from(document.querySelectorAll('div'));
                            const optionDivs = allDivs.filter(d => {
                                const rect = d.getBoundingClientRect();
                                const text = d.textContent.trim();
                                const children = d.children.length;

                                // Option divs are typically: in right area, have certain height, short text
                                return rect.top > 300 && rect.top < 650 &&
                                    rect.height > 20 && rect.height < 100 &&
                                    rect.width > 20 &&
                                    text.length > 0 && text.length < 50 &&
                                    !text.includes('Submit') && !text.includes('Next') &&
                                    !text.includes('Report') && !text.includes('Feedback') &&
                                    !text.includes('Doubt') && !text.includes('Question');
                            });

                            // Sort by vertical position and remove nested
                            const sorted = optionDivs.sort((a, b) =>
                                a.getBoundingClientRect().top - b.getBoundingClientRect().top
                            );
                            const unique = sorted.filter((d, i) =>
                                !sorted.some((other, j) => j !== i && d.contains(other))
                            );

                            if (unique.length >= 2 && unique[idx]) {
                                unique[idx].click();
                                return { success: true, method: 'div', text: unique[idx].textContent.trim().substring(0, 20), count: unique.length };
                            }

                            return { success: false, radioCount: radios.length, labelCount: optionLabels.length, divCount: unique.length };
                        }, optionIndex);


                    }
                } else {
                    dashState.skipped++;
                    renderDashboard();
                }

                await wait(1000); // 1 second gap before Submit

                // ALWAYS click Submit after handling the question

                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const submitBtn = buttons.find(b => b.textContent.trim() === 'Submit');
                    if (submitBtn) submitBtn.click();
                });
                await wait(1500); // Wait for answer to appear

                // DEBUG: Dump page info to understand how answers are displayed

                const pageDebug = await page.evaluate(() => {
                    const info = {
                        greenElements: [],
                        textWithCorrect: [],
                        allOptionsArea: [],
                        svgElements: []
                    };

                    // Find all elements with green-ish colors
                    const allEls = document.querySelectorAll('*');
                    for (const el of allEls) {
                        const style = window.getComputedStyle(el);
                        const bg = style.backgroundColor;
                        const color = style.color;
                        const border = style.borderColor;
                        const text = el.textContent?.trim().substring(0, 50) || '';
                        const rect = el.getBoundingClientRect();

                        // Check for green colors
                        const hasGreen = (c) => c && (c.includes('0, 128') || c.includes('34, 197') ||
                            c.includes('22, 163') || c.includes('16, 185') || c.includes('74, 222') ||
                            c.includes('0, 255') || c.includes('0, 200') || c.includes('5, 150'));

                        if (hasGreen(bg) || hasGreen(color) || hasGreen(border)) {
                            if (rect.top > 100 && rect.top < 700 && text.length > 0 && text.length < 100) {
                                info.greenElements.push({
                                    tag: el.tagName,
                                    text: text,
                                    top: Math.round(rect.top),
                                    bg: bg,
                                    color: color
                                });
                            }
                        }

                        // Check for "correct" text
                        if (text.toLowerCase().includes('correct') && rect.top > 100 && rect.top < 700) {
                            info.textWithCorrect.push({
                                tag: el.tagName,
                                text: text,
                                top: Math.round(rect.top)
                            });
                        }

                        // Elements in options area (300-550px from top)
                        if (rect.top > 300 && rect.top < 550 && rect.height > 20 && rect.height < 80) {
                            const txt = el.textContent?.trim() || '';
                            if (txt.length > 0 && txt.length < 50 && !txt.includes('Submit') &&
                                !txt.includes('Clear') && !txt.includes('Next')) {
                                info.allOptionsArea.push({
                                    tag: el.tagName,
                                    text: txt,
                                    top: Math.round(rect.top),
                                    class: (el.className || '').toString().substring(0, 30)
                                });
                            }
                        }
                    }

                    // Check SVGs
                    const svgs = document.querySelectorAll('svg');
                    for (const svg of svgs) {
                        const rect = svg.getBoundingClientRect();
                        if (rect.top > 200 && rect.top < 600) {
                            const parent = svg.closest('div');
                            info.svgElements.push({
                                top: Math.round(rect.top),
                                parentText: parent?.textContent?.trim().substring(0, 30) || ''
                            });
                        }
                    }

                    return info;
                });



                const extractedAnswer = await page.evaluate((qType) => {
                    const result = { found: false, answer: null, method: null, debug: [] };

                    // Helper to check if element is part of numpad (to exclude)
                    const isNumpad = (el) => {
                        const classes = el.className?.toString() || '';
                        const parent = el.closest('div');
                        const parentClasses = parent?.className?.toString() || '';
                        // Numpad buttons typically have m-1 w-1/3 classes
                        return classes.includes('m-1') || classes.includes('w-1/3') ||
                            parentClasses.includes('grid') ||
                            el.textContent?.trim() === 'Clear All' ||
                            el.textContent?.trim() === '←';
                    };

                    const allElements = Array.from(document.querySelectorAll('*'));

                    // ═══════════════════════════════════════════════════════════
                    // FOR TYPE-IN QUESTIONS: Look for numeric answers FIRST
                    // ═══════════════════════════════════════════════════════════
                    if (qType === 'type') {
                        // Strategy T1: Look for "Correct Answer: [number]" pattern
                        for (const el of allElements) {
                            const text = el.textContent?.trim() || '';

                            // Match "Correct Answer: 123" or "Correct Answer: -45.67"
                            const numMatch = text.match(/correct\s*answer[:\s]+(-?\d+\.?\d*)/i);
                            if (numMatch && numMatch[1]) {
                                result.found = true;
                                result.answer = numMatch[1];
                                result.method = 'correct-answer-number';
                                return result;
                            }
                        }

                        // Strategy T2: Look for green-highlighted number
                        for (const el of allElements) {
                            if (isNumpad(el)) continue;

                            const rect = el.getBoundingClientRect();
                            if (rect.top < 150 || rect.top > 600) continue;

                            const style = window.getComputedStyle(el);
                            const bgColor = style.backgroundColor;
                            const borderColor = style.borderColor;
                            const textColor = style.color;
                            const text = el.textContent?.trim() || '';

                            // Check for green colors
                            const isGreen = (color) => {
                                if (!color) return false;
                                return color.includes('34, 197') || color.includes('22, 163') ||
                                    color.includes('16, 185') || color.includes('0, 128') ||
                                    color.includes('74, 222') || color.includes('134, 239') ||
                                    color.includes('5, 150') || color.includes('4, 120');
                            };

                            // If it's a green element with just a number, that's our answer
                            if ((isGreen(bgColor) || isGreen(borderColor) || isGreen(textColor)) &&
                                /^-?\d+\.?\d*$/.test(text) && text.length < 15) {
                                result.found = true;
                                result.answer = text;
                                result.method = 'green-number';
                                return result;
                            }
                        }

                        // Strategy T3: Look for standalone number near "Correct" text
                        for (const el of allElements) {
                            if (isNumpad(el)) continue;
                            const rect = el.getBoundingClientRect();
                            if (rect.top < 150 || rect.top > 600) continue;

                            const text = el.textContent?.trim() || '';
                            // Check if parent/siblings contain "correct" and this element is a number
                            if (/^-?\d+\.?\d*$/.test(text) && text.length < 15) {
                                const parent = el.parentElement;
                                const parentText = parent?.textContent?.toLowerCase() || '';
                                if (parentText.includes('correct') && !parentText.includes('incorrect')) {
                                    result.found = true;
                                    result.answer = text;
                                    result.method = 'number-near-correct';
                                    return result;
                                }
                            }
                        }

                        // If no numeric answer found for type question, don't fall through to MCQ extraction
                        // Just return not found - we don't want to save A/B/C/D for a type question
                        return result;
                    }

                    // ═══════════════════════════════════════════════════════════
                    // FOR MCQ QUESTIONS: Look for letter answers
                    // ═══════════════════════════════════════════════════════════

                    // Number to letter mapping (1=A, 2=B, 3=C, 4=D)
                    const numToLetter = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };

                    // Strategy M1: Look for "Correct Option: X" pattern
                    for (const el of allElements) {
                        const text = el.textContent?.trim() || '';

                        // Match "Correct Option: 4" or "Correct Option: 1" etc.
                        const optionMatch = text.match(/correct\s*option[:\s]+(\d)/i);
                        if (optionMatch && optionMatch[1]) {
                            const num = optionMatch[1];
                            const letter = numToLetter[num] || num;
                            result.found = true;
                            result.answer = letter;
                            result.method = 'correct-option-number';
                            return result;
                        }

                        // Also check for direct letter: "Correct Option: A" 
                        const letterMatch = text.match(/correct\s*option[:\s]+([A-D])/i);
                        if (letterMatch && letterMatch[1]) {
                            result.found = true;
                            result.answer = letterMatch[1].toUpperCase();
                            result.method = 'correct-option-letter';
                            return result;
                        }

                        // Fallback: "Correct Answer: A/B/C/D"
                        const answerMatch = text.match(/correct\s*answer[:\s]+([A-D])/i);
                        if (answerMatch && answerMatch[1]) {
                            result.found = true;
                            result.answer = answerMatch[1].toUpperCase();
                            result.method = 'correct-answer-label';
                            return result;
                        }
                    }

                    // Strategy M2: Look for green/success colored elements with option text
                    for (const el of allElements) {
                        if (isNumpad(el)) continue;

                        const rect = el.getBoundingClientRect();
                        if (rect.top < 150 || rect.top > 600) continue;

                        const style = window.getComputedStyle(el);
                        const bgColor = style.backgroundColor;
                        const borderColor = style.borderColor;
                        const text = el.textContent?.trim() || '';

                        const isGreen = (color) => {
                            if (!color) return false;
                            return color.includes('34, 197') || color.includes('22, 163') ||
                                color.includes('16, 185') || color.includes('0, 128') ||
                                color.includes('74, 222') || color.includes('134, 239') ||
                                color.includes('5, 150') || color.includes('4, 120');
                        };

                        if ((isGreen(bgColor) || isGreen(borderColor)) && text.length > 0 && text.length < 100) {
                            // For MCQ: look for option letter at start
                            const optionMatch = text.match(/^([A-D])[.\s)]/);
                            if (optionMatch) {
                                result.found = true;
                                result.answer = optionMatch[1];
                                result.method = 'green-option';
                                return result;
                            }
                        }
                    }

                    // Strategy M3: Look for SVG checkmark/tick icon near an option
                    const svgs = document.querySelectorAll('svg');
                    for (const svg of svgs) {
                        const parentDiv = svg.closest('div');
                        if (!parentDiv) continue;

                        const rect = parentDiv.getBoundingClientRect();
                        if (rect.top < 150 || rect.top > 600) continue;

                        const svgColor = window.getComputedStyle(svg).color;
                        const pathD = svg.querySelector('path')?.getAttribute('d') || '';
                        const isCheck = pathD.includes('M5') || pathD.includes('check') ||
                            svgColor.includes('34, 197') || svgColor.includes('22, 163');

                        if (isCheck) {
                            const text = parentDiv.textContent?.trim() || '';
                            const optionMatch = text.match(/([A-D])[.\s)]/);
                            if (optionMatch) {
                                result.found = true;
                                result.answer = optionMatch[1];
                                result.method = 'checkmark-svg';
                                return result;
                            }
                        }
                    }

                    // Strategy M4: Scan page text for "correct answer" pattern
                    const pageText = document.body.innerText;
                    const correctMatch = pageText.match(/correct\s*(?:answer)?[:\s]+([A-D])/i);
                    if (correctMatch) {
                        result.found = true;
                        result.answer = correctMatch[1].toUpperCase();
                        result.method = 'text-scan';
                        return result;
                    }

                    // Strategy M5: Look for radio/checkbox that's checked with correct indicator
                    const inputs = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
                    for (const input of inputs) {
                        const label = input.closest('label') || input.parentElement;
                        if (!label) continue;

                        const style = window.getComputedStyle(label);
                        const bgColor = style.backgroundColor;

                        if (bgColor && (bgColor.includes('34, 197') || bgColor.includes('22, 163'))) {
                            const text = label.textContent?.trim() || '';
                            const optionMatch = text.match(/^([A-D])[.\s)]/);
                            if (optionMatch) {
                                result.found = true;
                                result.answer = optionMatch[1];
                                result.method = 'checked-green';
                                return result;
                            }
                        }
                    }

                    return result;
                }, questionType);

                if (extractedAnswer.found) {
                    saveAnswer(questionText, questionType, extractedAnswer.answer);
                }

                await wait(500);

                // Click Next Question
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const nextBtn = buttons.find(b => b.textContent.trim() === 'Next Question');
                    if (nextBtn) nextBtn.click();
                });

                await wait(1000);
            }

            dashState.status = 'Submitting'; renderDashboard();

            // Final submit to end test
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const submitBtn = buttons.find(b => b.textContent.trim() === 'Submit');
                if (submitBtn) submitBtn.click();
            });
            await wait(3000);

            dashState.status = 'Next test...';
            renderDashboard();

            // Click "Attempt Next Test" button to start the next test directly

            const clickedNextTest = await page.evaluate(() => {
                const allElements = Array.from(document.querySelectorAll('*'));

                // Strategy 1: Exact match for "Attempt Next Test"
                for (const el of allElements) {
                    const text = el.textContent?.trim() || '';
                    if (text === 'Attempt Next Test') {
                        el.click();
                        return { success: true, method: 'exact', text: text };
                    }
                }

                // Strategy 2: Button with similar text
                const buttons = Array.from(document.querySelectorAll('button'));
                for (const btn of buttons) {
                    const text = btn.textContent?.trim() || '';
                    if (text.toLowerCase().includes('attempt') && text.toLowerCase().includes('next')) {
                        btn.click();
                        return { success: true, method: 'button-partial', text: text };
                    }
                    if (text.toLowerCase().includes('next test')) {
                        btn.click();
                        return { success: true, method: 'button-next-test', text: text };
                    }
                }

                // Strategy 3: Link with "Attempt Next Test" text
                const links = Array.from(document.querySelectorAll('a'));
                for (const link of links) {
                    const text = link.textContent?.trim() || '';
                    if (text.toLowerCase().includes('attempt') && text.toLowerCase().includes('next')) {
                        link.click();
                        return { success: true, method: 'link', text: text };
                    }
                }

                // Strategy 4: Any clickable element with the text
                for (const el of allElements) {
                    const text = el.textContent?.trim() || '';
                    if (text.toLowerCase().includes('attempt next') && text.length < 50) {
                        el.click();
                        return { success: true, method: 'any-element', text: text };
                    }
                }

                return { success: false };
            });

            if (!clickedNextTest.success) {
                // Fallback: Try other common button names
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const fallbackTexts = ['Retry', 'Try Again', 'Start Again', 'Reattempt', 'New Test'];
                    for (const btn of buttons) {
                        const text = btn.textContent?.trim() || '';
                        for (const fallback of fallbackTexts) {
                            if (text.toLowerCase().includes(fallback.toLowerCase())) {
                                btn.click();
                                return;
                            }
                        }
                    }
                });
            }

            dashState.status = 'Running';
            renderDashboard();

            await wait(4000);
        }

    } catch (error) {
        log.error(`Error: ${error.message}`);
    } finally {
        // Restore stdin
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.removeAllListeners('data');
            process.stdin.pause();
        }
        dashState.status = 'Stopped';
        renderDashboard();
        console.log('');
        await prompt('Press Enter to return to menu...');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════
runCLI().catch(err => {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
});
