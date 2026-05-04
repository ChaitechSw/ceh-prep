# 🛡️ CEH Prep System

> A 30-day AI-powered study tracker for the **Certified Ethical Hacker (CEH)** exam.  
> Built with React + Vite · Quiz engine powered by Claude AI · Progress saved in localStorage.

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/ceh-prep.git
cd ceh-prep
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
```

Open `.env` and paste your key:

```
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> Get a key at [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.  
> ⚠️ The `.env` file is in `.gitignore` — it will **never** be committed to GitHub.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
ceh-prep/
├── src/
│   ├── App.jsx          # Main app (all UI + logic)
│   └── main.jsx         # React entry point
├── scripts/
│   └── generate-progress.js   # Updates README progress section
├── .github/
│   └── workflows/
│       └── update-progress.yml  # Auto-updates README on push
├── .env.example         # Template — copy to .env
├── .gitignore           # Keeps .env and node_modules out of git
├── progress.json        # ← Export your progress here to show on GitHub
└── README.md
```

---

## 🔄 Keeping GitHub Updated

Your in-app progress lives in your browser's localStorage. To show it on GitHub:

1. Open the app → Analytics tab → click **Export Progress JSON**
2. Save the file as `progress.json` in the project root
3. `git add progress.json && git commit -m "day X complete" && git push`

GitHub Actions will automatically rewrite the progress section below.

---

## 📋 What's Inside

| Tab | What it does |
|-----|-------------|
| **Dashboard** | Overview, day grid, quick-start buttons |
| **30-Day Plan** | Full schedule with domain → day mapping |
| **Today's Study** | 6-task daily checklist with notes |
| **AI Quiz** | Claude generates CEH-style MCQs on demand |
| **Analytics** | Domain accuracy, readiness meter, pass prediction |

---

## 🎯 CEH Exam Facts

- **125 questions** · 4 hours · **70% passing score**
- Test at Pearson VUE or ECC Exam Center
- Register at least 2 weeks before your target date

---

<!-- PROGRESS:START -->
## 📊 CEH Study Progress

> Last updated: **Not started yet**

| Metric | Value |
|--------|-------|
| 📅 Current Day | **0 / 30** |
| ✅ Days Completed | **0 / 30** |
| 🎯 Quiz Accuracy | **0%** |
| ❓ Questions Answered | **0** |
| ✔️  Correct Answers | **0** |
| 🏁 Pass Readiness | ⚠️  Needs work |

### Study Coverage
```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

### Quiz Accuracy  *(need 70% to pass)*
```
[░░░░░░░░░░░░░░░░░░░░] 0%  [target: 70%]
```

<!-- PROGRESS:END -->
