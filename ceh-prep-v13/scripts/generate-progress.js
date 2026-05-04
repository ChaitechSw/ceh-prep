/**
 * generate-progress.js
 *
 * Reads progress.json (committed manually or via export button) and
 * rewrites the <!-- PROGRESS --> block in README.md.
 *
 * Run locally:   node scripts/generate-progress.js
 * Run in CI:     triggered by GitHub Actions on every push
 */

const fs   = require("fs");
const path = require("path");

const PROGRESS_FILE = path.join(__dirname, "../progress.json");
const README_FILE   = path.join(__dirname, "../README.md");

// ── Load progress data ────────────────────────────────────────────────────
let data = {
  currentDay: 0,
  completedDays: 0,
  accuracy: 0,
  totalQuizzes: 0,
  totalCorrect: 0,
  lastUpdated: new Date().toISOString(),
  domainScores: {},
};

if (fs.existsSync(PROGRESS_FILE)) {
  try {
    data = { ...data, ...JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")) };
  } catch (e) {
    console.warn("Could not parse progress.json, using defaults.");
  }
}

const progress     = Math.round((data.completedDays / 30) * 100);
const bar          = buildBar(progress, 20);
const accBar       = buildBar(data.accuracy, 20);
const passStatus   = data.accuracy >= 70 ? "✅ On track" : "⚠️  Needs work";
const updatedDate  = new Date(data.lastUpdated).toDateString();

// ── Build the markdown block ─────────────────────────────────────────────
const block = `<!-- PROGRESS:START -->
## 📊 CEH Study Progress

> Last updated: **${updatedDate}**

| Metric | Value |
|--------|-------|
| 📅 Current Day | **${data.currentDay} / 30** |
| ✅ Days Completed | **${data.completedDays} / 30** |
| 🎯 Quiz Accuracy | **${data.accuracy}%** |
| ❓ Questions Answered | **${data.totalQuizzes}** |
| ✔️  Correct Answers | **${data.totalCorrect}** |
| 🏁 Pass Readiness | ${passStatus} |

### Study Coverage
\`\`\`
${bar} ${progress}%
\`\`\`

### Quiz Accuracy  *(need 70% to pass)*
\`\`\`
${accBar} ${data.accuracy}%  [target: 70%]
\`\`\`

<!-- PROGRESS:END -->`;

// ── Inject into README ────────────────────────────────────────────────────
let readme = "";
if (fs.existsSync(README_FILE)) {
  readme = fs.readFileSync(README_FILE, "utf8");
}

const START_TAG = "<!-- PROGRESS:START -->";
const END_TAG   = "<!-- PROGRESS:END -->";

if (readme.includes(START_TAG)) {
  const before = readme.substring(0, readme.indexOf(START_TAG));
  const after  = readme.substring(readme.indexOf(END_TAG) + END_TAG.length);
  readme = before + block + after;
} else {
  // Append if markers not found
  readme += "\n\n" + block + "\n";
}

fs.writeFileSync(README_FILE, readme, "utf8");
console.log("✅ README.md updated with latest progress.");

// ── Helper ────────────────────────────────────────────────────────────────
function buildBar(pct, width) {
  const filled = Math.round((Math.min(100, pct) / 100) * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}
