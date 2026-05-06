#!/usr/bin/env bash
# CEH v13 Prep — Daily GitHub Commit Script

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║     CEH v13 PREP — DAILY COMMIT TOOL     ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROGRESS_FILE="$PROJECT_ROOT/progress.json"
DOWNLOADS="$HOME/Downloads/progress.json"

echo -e "${CYAN}[1/6] Looking for progress.json...${RESET}"

if [ -f "$DOWNLOADS" ]; then
  cp "$DOWNLOADS" "$PROGRESS_FILE"
  echo -e "${GREEN}  ✓ Found in Downloads — copied to project.${RESET}"
elif [ -f "$PROGRESS_FILE" ]; then
  echo -e "${YELLOW}  ✓ Using existing progress.json in project root.${RESET}"
else
  echo -e "${RED}  ✗ progress.json not found.${RESET}"
  echo -e "    Export it from the app (⬇ EXPORT button) then run this script again."
  exit 1
fi

echo -e "${CYAN}[2/6] Reading progress data...${RESET}"

read -r DAY COMPLETED ACCURACY TOTAL_Q TOTAL_C < <(node -e "
  const d = JSON.parse(require('fs').readFileSync('$PROGRESS_FILE','utf8'));
  process.stdout.write([
    d.currentDay || 0,
    d.completedDays || 0,
    d.accuracy || 0,
    d.totalQuizzes || 0,
    d.totalCorrect || 0,
  ].join(' '));
")

DOMAIN=$(node -e "
const domains = [
  { days:[1,2],      name:'Information Security Fundamentals' },
  { days:[3,4,5],    name:'Reconnaissance & Footprinting' },
  { days:[6,7],      name:'Scanning Networks' },
  { days:[8,9],      name:'Enumeration' },
  { days:[10,11],    name:'Vulnerability Analysis' },
  { days:[12,13,14], name:'System Hacking' },
  { days:[15,16],    name:'Malware Threats' },
  { days:[17],       name:'Sniffing' },
  { days:[18],       name:'Social Engineering' },
  { days:[19],       name:'Denial of Service' },
  { days:[20],       name:'Session Hijacking' },
  { days:[21],       name:'Evading IDS Firewalls and Honeypots' },
  { days:[22,23],    name:'Hacking Web Servers and Applications' },
  { days:[24],       name:'SQL Injection' },
  { days:[25],       name:'Wireless Hacking' },
  { days:[26],       name:'Mobile and IoT Hacking' },
  { days:[27],       name:'Cloud Security' },
  { days:[28],       name:'Cryptography' },
  { days:[29,30],    name:'AI in Ethical Hacking' },
  { days:[31,32],    name:'Full Review and Mock Exams' },
];
const d = domains.find(d => d.days.includes($DAY));
process.stdout.write(d ? d.name : 'General Study');
")

DATE_STR=$(date '+%Y-%m-%d')
DATE_PRETTY=$(date '+%B %d, %Y')

echo -e "  Day: ${BOLD}$DAY${RESET} | Domain: ${BOLD}$DOMAIN${RESET}"
echo -e "  Accuracy: ${BOLD}$ACCURACY%${RESET} | Questions: ${BOLD}$TOTAL_Q${RESET}"
echo ""

echo -e "${CYAN}[3/6] Enter your study notes for today.${RESET}"
echo -e "  ${YELLOW}(Type each note and press Enter. Press Enter on empty line when done.)${RESET}"
echo ""

NOTES_LIST=()
NOTE_INDEX=1
while true; do
  read -rp "  Note $NOTE_INDEX: " NOTE_INPUT
  if [[ -z "$NOTE_INPUT" ]]; then break; fi
  NOTES_LIST+=("$NOTE_INPUT")
  ((NOTE_INDEX++))
done

echo ""
echo -e "${CYAN}[4/6] Tools used or studied today.${RESET}"
echo -e "  ${YELLOW}(Type each tool and press Enter. Press Enter on empty line when done.)${RESET}"
echo ""

TOOLS_LIST=()
TOOL_INDEX=1
while true; do
  read -rp "  Tool $TOOL_INDEX: " TOOL_INPUT
  if [[ -z "$TOOL_INPUT" ]]; then break; fi
  TOOLS_LIST+=("$TOOL_INPUT")
  ((TOOL_INDEX++))
done

echo ""
echo -e "${CYAN}[5/6] Writing notes/day-$(printf '%02d' $DAY).md...${RESET}"

NOTES_DIR="$PROJECT_ROOT/notes"
mkdir -p "$NOTES_DIR"
NOTE_FILE="$NOTES_DIR/day-$(printf '%02d' $DAY).md"

NOTES_MD=""
if [ ${#NOTES_LIST[@]} -gt 0 ]; then
  for note in "${NOTES_LIST[@]}"; do NOTES_MD+="- $note"$'\n'; done
else
  NOTES_MD="- No notes added today."$'\n'
fi

TOOLS_MD=""
if [ ${#TOOLS_LIST[@]} -gt 0 ]; then
  for tool in "${TOOLS_LIST[@]}"; do TOOLS_MD+="- \`$tool\`"$'\n'; done
else
  TOOLS_MD="- No tools logged today."$'\n'
fi

SCORES_TABLE=$(node -e "
  const d = JSON.parse(require('fs').readFileSync('$PROGRESS_FILE','utf8'));
  const scores = d.domainScores || {};
  let rows = '';
  for (const [name, s] of Object.entries(scores)) {
    const bar = '█'.repeat(Math.round(s.accuracy/10)) + '░'.repeat(10-Math.round(s.accuracy/10));
    const status = s.accuracy >= 70 ? '✅' : '⚠️';
    rows += '| ' + name.substring(0,35).padEnd(35) + ' | ' + String(s.accuracy+'%').padStart(4) + ' | ' + s.correct + '/' + s.total + ' | ' + bar + ' ' + status + ' |\n';
  }
  if (!rows) rows = '| No quiz data yet | — | — | — |\n';
  process.stdout.write(rows);
")

DOMAIN_TOOLS=""
if [ ${#TOOLS_LIST[@]} -gt 0 ]; then
  DOMAIN_TOOLS=$(IFS=', '; echo "${TOOLS_LIST[*]}")
fi

cat > "$NOTE_FILE" << MDEOF
# Day $DAY — $DOMAIN

**Date:** $DATE_PRETTY
**Overall Quiz Accuracy:** $ACCURACY% ($TOTAL_C / $TOTAL_Q correct)
**Days Completed:** $COMPLETED / 32

---

## 📝 Study Notes

$NOTES_MD
---

## 🛠️ Tools Practiced Today

$TOOLS_MD
---

## 📊 Quiz Scores by Domain

| Domain | Accuracy | Score | Progress |
|--------|----------|-------|----------|
$SCORES_TABLE

---

> *Generated by daily-commit.sh on $DATE_STR*
MDEOF

echo -e "${GREEN}  ✓ Written: notes/day-$(printf '%02d' $DAY).md${RESET}"

echo ""
echo -e "${CYAN}[6/6] Committing to GitHub...${RESET}"

cd "$PROJECT_ROOT"

git add progress.json
git add "notes/day-$(printf '%02d' $DAY).md"

PASS_STATUS=""
if [ "$ACCURACY" -ge 70 ]; then
  PASS_STATUS="✅ on track"
else
  PASS_STATUS="⚠️ needs work"
fi

TOOLS_INLINE=""
if [ ${#TOOLS_LIST[@]} -gt 0 ]; then
  TOOLS_INLINE=" | tools: $(IFS=', '; echo "${TOOLS_LIST[*]}")"
fi

COMMIT_MSG="day $DAY/$COMPLETED complete — $DOMAIN | accuracy: $ACCURACY% ($PASS_STATUS)$TOOLS_INLINE [$DATE_STR]"

echo ""
echo -e "${YELLOW}  Commit message:${RESET}"
echo -e "  ${BOLD}$COMMIT_MSG${RESET}"
echo ""
read -rp "  Press Enter to commit and push, or Ctrl+C to cancel... "

git commit -m "$COMMIT_MSG"
git push

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║         PUSHED TO GITHUB ✓               ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Day $DAY complete. $((32 - DAY)) days remaining. Keep hacking! 🛡️"
echo ""
