import { useState, useEffect } from "react";

// Groq API key from .env file
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ─── CEH Domain Schedule ─────────────────────────────────────────────────────
const CEH_DOMAINS = [
  { id: 1,  name: "Information Security Fundamentals",  weight: 6,  days: [1, 2],       tools: ["None — theory only"] },
  { id: 2,  name: "Reconnaissance & Footprinting",      weight: 9,  days: [3, 4, 5],    tools: ["Maltego", "theHarvester", "Shodan", "Recon-ng", "WHOIS"] },
  { id: 3,  name: "Scanning Networks",                  weight: 8,  days: [6, 7],       tools: ["Nmap", "Zenmap", "Hping3", "Angry IP Scanner"] },
  { id: 4,  name: "Enumeration",                        weight: 8,  days: [8, 9],       tools: ["Enum4linux", "NBTScan", "SNMPwalk", "Netcat", "DirBuster"] },
  { id: 5,  name: "Vulnerability Analysis",             weight: 7,  days: [10, 11],     tools: ["Nessus", "OpenVAS", "Nikto", "QualysGuard"] },
  { id: 6,  name: "System Hacking",                     weight: 12, days: [12, 13, 14], tools: ["Metasploit", "Mimikatz", "John the Ripper", "Hashcat", "Netcat"] },
  { id: 7,  name: "Malware Threats",                    weight: 8,  days: [15, 16],     tools: ["VirusTotal", "Any.run", "Wireshark", "Process Monitor"] },
  { id: 8,  name: "Sniffing",                           weight: 7,  days: [17],         tools: ["Wireshark", "Tcpdump", "Ettercap", "Cain & Abel"] },
  { id: 9,  name: "Social Engineering",                 weight: 7,  days: [18],         tools: ["SET (Social Engineering Toolkit)", "GoPhish"] },
  { id: 10, name: "Denial of Service",                  weight: 6,  days: [19],         tools: ["LOIC", "HOIC", "Hping3"] },
  { id: 11, name: "Session Hijacking",                  weight: 6,  days: [20],         tools: ["Burp Suite", "Wireshark", "Hamster & Ferret"] },
  { id: 12, name: "Evading IDS, Firewalls & Honeypots", weight: 6,  days: [21],         tools: ["Nmap (evasion flags)", "Fragroute", "Whisker"] },
  { id: 13, name: "Hacking Web Servers & Applications", weight: 8,  days: [22, 23],     tools: ["Burp Suite", "OWASP ZAP", "Nikto", "dirb", "wfuzz"] },
  { id: 14, name: "SQL Injection",                      weight: 5,  days: [24],         tools: ["SQLmap", "Burp Suite", "Havij"] },
  { id: 15, name: "Wireless Hacking",                   weight: 6,  days: [25],         tools: ["Aircrack-ng", "Kismet", "Wifite", "Reaver"] },
  { id: 16, name: "Mobile & IoT Hacking",               weight: 5,  days: [26],         tools: ["Drozer", "MobSF", "APKTool", "Frida"] },
  { id: 17, name: "Cloud Security",                     weight: 5,  days: [27],         tools: ["Pacu", "ScoutSuite", "CloudSploit"] },
  { id: 18, name: "Cryptography",                       weight: 5,  days: [28],         tools: ["OpenSSL", "HashCalc", "CrypTool", "VeraCrypt"] },
  { id: 19, name: "Full Review & Mock Exams",            weight: 0,  days: [29, 30],     tools: ["All tools reviewed"] },
];

const DAILY_TASKS = {
  morning:   ["Read domain theory (45 min)", "Watch video walkthrough (30 min)"],
  afternoon: ["Hands-on lab / tool practice (45 min)", "Flashcard review (15 min)"],
  evening:   ["AI-powered quiz (20 questions)", "Log weak areas & notes"],
};

// ─── localStorage helpers ─────────────────────────────────────────────────────
const ls = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function CEHPrep() {
  const [activeTab,     setActiveTab]     = useState("dashboard");
  const [currentDay,    setCurrentDay]    = useState(() => ls.get("ceh_currentDay", 1));
  const [completedDays, setCompletedDays] = useState(() => ls.get("ceh_completedDays", {}));
  const [quizState,     setQuizState]     = useState(null);
  const [quizAnswer,    setQuizAnswer]    = useState(null);
  const [loadingQuiz,   setLoadingQuiz]   = useState(false);
  const [quizHistory,   setQuizHistory]   = useState(() => ls.get("ceh_quizHistory", []));
  const [notes,         setNotes]         = useState(() => ls.get("ceh_notes", {}));
  const [noteInput,     setNoteInput]     = useState("");
  const [scores,        setScores]        = useState(() => ls.get("ceh_scores", {}));
  const [exportMsg,     setExportMsg]     = useState("");

  // Auto-save to localStorage on every change
  useEffect(() => ls.set("ceh_currentDay",    currentDay),    [currentDay]);
  useEffect(() => ls.set("ceh_completedDays", completedDays), [completedDays]);
  useEffect(() => ls.set("ceh_quizHistory",   quizHistory),   [quizHistory]);
  useEffect(() => ls.set("ceh_notes",         notes),         [notes]);
  useEffect(() => ls.set("ceh_scores",        scores),        [scores]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const todayDomain    = CEH_DOMAINS.find(d => d.days.includes(currentDay)) || CEH_DOMAINS[CEH_DOMAINS.length - 1];
  const totalCompleted = Object.keys(completedDays).filter(d => isDayComplete(Number(d))).length;
  const progress       = Math.round((totalCompleted / 30) * 100);
  const totalQuizzes   = quizHistory.length;
  const totalCorrect   = quizHistory.filter(q => q.correct).length;
  const accuracy       = totalQuizzes > 0 ? Math.round((totalCorrect / totalQuizzes) * 100) : 0;

  // ── Task helpers ────────────────────────────────────────────────────────────
  function toggleTask(day, key) {
    setCompletedDays(prev => ({ ...prev, [day]: { ...(prev[day] || {}), [key]: !(prev[day]?.[key]) } }));
  }
  function isDayComplete(day) {
    return Object.values(completedDays[day] || {}).filter(Boolean).length >= 6;
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  function resetProgress() {
    if (!confirm("Reset ALL progress? This cannot be undone.")) return;
    ["ceh_currentDay","ceh_completedDays","ceh_quizHistory","ceh_notes","ceh_scores"]
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }

  // ── Export progress.json ────────────────────────────────────────────────────
  function exportProgress() {
    const domainScores = {};
    CEH_DOMAINS.forEach(d => {
      const s = scores[d.id] || { correct: 0, total: 0 };
      if (s.total > 0) domainScores[d.name] = {
        accuracy: Math.round((s.correct / s.total) * 100),
        correct: s.correct,
        total: s.total,
      };
    });
    const payload = {
      currentDay,
      completedDays: totalCompleted,
      accuracy,
      totalQuizzes,
      totalCorrect,
      lastUpdated: new Date().toISOString(),
      domainScores,
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "progress.json";
    a.click();
    setExportMsg("✓ Saved to Downloads! Now run ./scripts/daily-commit.sh");
    setTimeout(() => setExportMsg(""), 5000);
  }

  // ── Groq Quiz ───────────────────────────────────────────────────────────────
  async function generateQuiz() {
    if (!GROQ_API_KEY) {
      setQuizState({ error: "Groq API key not found. Add VITE_GROQ_API_KEY to your .env file and restart the dev server." });
      return;
    }
    setLoadingQuiz(true);
    setQuizAnswer(null);
    setQuizState(null);

    const prompt = `Generate a single CEH (Certified Ethical Hacker) exam-style multiple choice question about "${todayDomain.name}".
Return ONLY valid JSON with no markdown formatting, no backticks, no extra text. Use exactly this structure:
{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}
Make it exam-level difficulty, realistic, and tricky. Focus on tools, attack techniques, and countermeasures.`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          max_tokens: 600,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content || "";
      // Strip any accidental markdown fences
      const clean = raw.replace(/```json|```/g, "").trim();
      setQuizState(JSON.parse(clean));
    } catch (e) {
      setQuizState({ error: `Failed to generate question: ${e.message}` });
    }
    setLoadingQuiz(false);
  }

  function submitAnswer(opt) {
    if (!quizState || quizAnswer !== null) return;
    const letter  = opt.charAt(0);
    const correct = letter === quizState.correct;
    setQuizAnswer({ selected: letter, correct });
    setScores(prev => {
      const d = prev[todayDomain.id] || { correct: 0, total: 0 };
      return { ...prev, [todayDomain.id]: { correct: d.correct + (correct ? 1 : 0), total: d.total + 1 } };
    });
    setQuizHistory(prev => [
      { domain: todayDomain.name, question: quizState.question, correct, day: currentDay, date: new Date().toISOString() },
      ...prev.slice(0, 299),
    ]);
  }

  // ── Notes ───────────────────────────────────────────────────────────────────
  function saveNote() {
    if (!noteInput.trim()) return;
    setNotes(prev => ({ ...prev, [currentDay]: [...(prev[currentDay] || []), noteInput.trim()] }));
    setNoteInput("");
  }
  function deleteNote(day, index) {
    setNotes(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== index) }));
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "dashboard", label: "Dashboard",     icon: "⬡" },
    { id: "schedule",  label: "30-Day Plan",   icon: "◈" },
    { id: "today",     label: "Today's Study", icon: "◎" },
    { id: "quiz",      label: "AI Quiz",       icon: "⟁" },
    { id: "analytics", label: "Analytics",     icon: "▲" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* Background grid */}
      <div style={S.grid} />
      <div style={S.orb1} />
      <div style={S.orb2} />

      {/* ── Header ── */}
      <header style={S.header}>
        <div>
          <div style={S.headerSub}>CERTIFIED ETHICAL HACKER · 30-DAY PREP</div>
          <div style={S.headerTitle}>CEH PREP SYSTEM <span style={{ color: "#00ff9d" }}>v3.0</span></div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Badge label="DAY"      value={`${currentDay}/30`} color="#00ff9d" />
          <Badge label="PROGRESS" value={`${progress}%`}     color="#0099ff" />
          <Badge label="ACCURACY" value={`${accuracy}%`}     color={accuracy >= 70 ? "#00ff9d" : "#ff5555"} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportProgress} style={S.btnExport}>⬇ EXPORT</button>
            <button onClick={resetProgress}  style={S.btnReset}>RESET</button>
          </div>
        </div>
      </header>

      {/* Export toast */}
      {exportMsg && (
        <div style={S.toast}>{exportMsg}</div>
      )}

      {/* ── Nav ── */}
      <nav style={S.nav}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            ...S.navBtn,
            color:        activeTab === t.id ? "#00ff9d" : "rgba(232,228,217,0.4)",
            borderBottom: activeTab === t.id ? "2px solid #00ff9d" : "2px solid transparent",
          }}>
            <span>{t.icon}</span> {t.label.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <main style={S.main}>

        {/* ════════ DASHBOARD ════════ */}
        {activeTab === "dashboard" && (
          <div>
            <SectionTitle title="Mission Control" sub="Progress auto-saved · export anytime to push to GitHub" />

            <div style={S.statGrid}>
              <StatCard label="Days Completed"     value={totalCompleted} total={30} color="#00ff9d" />
              <StatCard label="Questions Answered" value={totalQuizzes}              color="#0099ff" />
              <StatCard label="Quiz Accuracy"      value={`${accuracy}%`}            color={accuracy >= 70 ? "#00ff9d" : "#ff6644"} note={accuracy < 70 ? "Need 70%+" : "On track ✓"} />
            </div>

            {/* Today's domain card */}
            <div style={S.domainCard}>
              <div style={S.label}>TODAY — DAY {currentDay}</div>
              <div style={S.domainName}>{todayDomain.name}</div>
              <div style={S.domainMeta}>Exam weight: {todayDomain.weight}% &nbsp;|&nbsp; Recommended tools: {todayDomain.tools.slice(0,3).join(", ")}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <button onClick={() => setActiveTab("today")}                      style={btn("#00ff9d")}>START TODAY'S STUDY →</button>
                <button onClick={() => { setActiveTab("quiz"); generateQuiz(); }}  style={btn("#0099ff")}>QUICK QUIZ ⟁</button>
              </div>
            </div>

            {/* Day grid */}
            <div style={S.card}>
              <div style={S.label}>30-DAY PROGRESS MAP</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                  <button key={d} onClick={() => setCurrentDay(d)} style={{
                    width: 36, height: 36, borderRadius: 6, cursor: "pointer",
                    fontFamily: "inherit", fontSize: 11, transition: "all 0.15s",
                    background:    isDayComplete(d) ? "#00ff9d" : d === currentDay ? "rgba(0,255,157,0.15)" : "rgba(255,255,255,0.04)",
                    color:         isDayComplete(d) ? "#0a0a0f" : d === currentDay ? "#00ff9d" : "rgba(232,228,217,0.3)",
                    fontWeight:    isDayComplete(d) ? 700 : 400,
                    border:        d === currentDay ? "1px solid #00ff9d" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                    {isDayComplete(d) ? "✓" : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Info tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
              {[
                { icon: "◉", title: "Exam Format",  body: "125 MCQ · 4 hours · 70% passing score" },
                { icon: "◈", title: "Test Center",   body: "Pearson VUE or ECC Exam Center" },
                { icon: "▲", title: "Key Strategy",  body: "Tools + attack phases + countermeasures = most questions" },
                { icon: "⟁", title: "Daily Target",  body: "20+ quiz questions/day · maintain 75%+ accuracy" },
              ].map(t => (
                <div key={t.title} style={S.tile}>
                  <span style={{ fontSize: 18, color: "#00ff9d" }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#00ff9d", marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(232,228,217,0.6)", lineHeight: 1.5 }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ 30-DAY SCHEDULE ════════ */}
        {activeTab === "schedule" && (
          <div>
            <SectionTitle title="30-Day Study Plan" sub="Domain schedule weighted by CEH exam percentage" />
            <div style={{ display: "grid", gap: 8 }}>
              {CEH_DOMAINS.map(domain => {
                const done = domain.days.every(d => isDayComplete(d));
                const today = domain.days.includes(currentDay);
                return (
                  <div key={domain.id} style={{ ...S.scheduleRow, background: today ? "rgba(0,255,157,0.05)" : "rgba(255,255,255,0.02)", border: today ? "1px solid rgba(0,255,157,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: done ? "#00ff9d" : "rgba(255,255,255,0.06)", color: done ? "#0a0a0f" : "rgba(232,228,217,0.3)", flexShrink: 0 }}>
                        {done ? "✓" : domain.id}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: today ? "#fff" : "rgba(232,228,217,0.8)" }}>{domain.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(232,228,217,0.35)", marginTop: 2 }}>
                          Day{domain.days.length > 1 ? "s" : ""} {domain.days.join(", ")}
                          {domain.weight > 0 && ` · ${domain.weight}% exam weight`}
                          {" · "}{domain.tools.slice(0,2).join(", ")}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {today && <span style={S.todayBadge}>TODAY</span>}
                      {domain.weight > 0 && (
                        <div style={{ width: 70, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                          <div style={{ width: `${(domain.weight / 12) * 100}%`, height: "100%", background: "#00ff9d", borderRadius: 2 }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════ TODAY'S STUDY ════════ */}
        {activeTab === "today" && (
          <div>
            <SectionTitle title={`Day ${currentDay} — ${todayDomain.name}`} sub="Check off all 6 tasks · saved automatically to localStorage" />

            {/* Day nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <button onClick={() => setCurrentDay(d => Math.max(1,  d - 1))} style={S.smallBtn}>← PREV</button>
              <span style={{ fontSize: 12, color: "rgba(232,228,217,0.4)" }}>Day {currentDay} of 30</span>
              <button onClick={() => setCurrentDay(d => Math.min(30, d + 1))} style={S.smallBtn}>NEXT →</button>
            </div>

            {/* Tools for today */}
            <div style={{ ...S.card, marginBottom: 16, borderColor: "rgba(0,153,255,0.2)" }}>
              <div style={{ ...S.label, color: "#0099ff" }}>🛠 TOOLS FOR TODAY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {todayDomain.tools.map(tool => (
                  <span key={tool} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(0,153,255,0.08)", border: "1px solid rgba(0,153,255,0.2)", borderRadius: 20, color: "#7ec8ff" }}>{tool}</span>
                ))}
              </div>
            </div>

            {/* Task sessions */}
            {[
              { session: "🌅  MORNING",   tasks: DAILY_TASKS.morning },
              { session: "☀️  AFTERNOON", tasks: DAILY_TASKS.afternoon },
              { session: "🌙  EVENING",   tasks: DAILY_TASKS.evening },
            ].map(({ session, tasks }, si) => (
              <div key={session} style={S.card}>
                <div style={S.label}>{session}</div>
                {tasks.map((task, ti) => {
                  const key  = `${si}-${ti}`;
                  const done = completedDays[currentDay]?.[key];
                  return (
                    <div key={key} onClick={() => toggleTask(currentDay, key)} style={{ ...S.taskRow, borderBottom: ti < tasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ ...S.checkbox, background: done ? "#00ff9d" : "transparent", border: done ? "none" : "1px solid rgba(0,255,157,0.3)" }}>
                        {done && <span style={{ fontSize: 11, color: "#0a0a0f", fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: done ? "rgba(232,228,217,0.3)" : "#e8e4d9", textDecoration: done ? "line-through" : "none" }}>{task}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Completion banner */}
            {isDayComplete(currentDay) && (
              <div style={S.completeBanner}>
                <div style={{ fontSize: 22 }}>⬡</div>
                <div>
                  <div style={{ fontSize: 13, color: "#00ff9d", letterSpacing: 2 }}>DAY {currentDay} COMPLETE — AUTO-SAVED ✓</div>
                  <div style={{ fontSize: 11, color: "rgba(232,228,217,0.4)", marginTop: 3 }}>{30 - currentDay} days remaining to exam</div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={S.card}>
              <div style={{ ...S.label, color: "#0099ff" }}>◈  STUDY NOTES — DAY {currentDay}</div>
              <div style={{ marginTop: 12 }}>
                {(notes[currentDay] || []).length === 0 && (
                  <div style={{ fontSize: 12, color: "rgba(232,228,217,0.25)", marginBottom: 10 }}>No notes yet. Add your key takeaways below.</div>
                )}
                {(notes[currentDay] || []).map((note, i) => (
                  <div key={i} style={S.noteItem}>
                    <span style={{ flex: 1, fontSize: 13 }}>{note}</span>
                    <button onClick={() => deleteNote(currentDay, i)} style={{ background: "none", border: "none", color: "rgba(255,100,100,0.4)", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveNote()}
                  placeholder="Type a note and press Enter..."
                  style={S.input}
                />
                <button onClick={saveNote} style={btn("#0099ff")}>ADD</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════ AI QUIZ ════════ */}
        {activeTab === "quiz" && (
          <div>
            <SectionTitle title="AI Quiz Engine" sub={`Powered by Groq (Llama 3) · Free · Domain: ${todayDomain.name}`} />

            <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={generateQuiz} disabled={loadingQuiz} style={btn("#00ff9d")}>
                {loadingQuiz ? "GENERATING..." : "⟁  GENERATE QUESTION"}
              </button>
              <span style={{ fontSize: 12, color: "rgba(232,228,217,0.35)" }}>
                {totalQuizzes} answered · {totalCorrect} correct · {accuracy}% accuracy
              </span>
            </div>

            {/* API key warning */}
            {!GROQ_API_KEY && (
              <div style={S.warning}>
                ⚠ &nbsp;<strong>VITE_GROQ_API_KEY</strong> not found in your .env file.<br />
                Get a free key at <strong>console.groq.com</strong> → add it to <code>.env</code> → restart <code>npm run dev</code>.
              </div>
            )}

            {/* Loading */}
            {loadingQuiz && (
              <div style={S.loadingBox}>
                <div style={{ fontSize: 26, animation: "spin 1.5s linear infinite", display: "inline-block" }}>⬡</div>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#00ff9d", marginTop: 10 }}>GENERATING CEH QUESTION...</div>
              </div>
            )}

            {/* Question */}
            {quizState && !loadingQuiz && !quizState.error && (
              <div style={S.card}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#0099ff", marginBottom: 14 }}>
                  CEH MCQ · {todayDomain.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.65, color: "#fff", marginBottom: 24 }}>
                  {quizState.question}
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {quizState.options?.map(opt => {
                    const letter     = opt.charAt(0);
                    const isSelected = quizAnswer?.selected === letter;
                    const isCorrect  = quizState.correct === letter;
                    let bg = "rgba(255,255,255,0.03)", border = "1px solid rgba(255,255,255,0.08)";
                    if (quizAnswer !== null) {
                      if (isCorrect)       { bg = "rgba(0,255,157,0.09)";  border = "1px solid rgba(0,255,157,0.4)"; }
                      else if (isSelected) { bg = "rgba(255,60,60,0.09)";  border = "1px solid rgba(255,60,60,0.4)"; }
                    }
                    return (
                      <button key={opt} onClick={() => submitAnswer(opt)} disabled={quizAnswer !== null} style={{ background: bg, border, borderRadius: 9, padding: "13px 16px", textAlign: "left", cursor: quizAnswer !== null ? "default" : "pointer", color: "#e8e4d9", fontSize: 13, fontFamily: "inherit", lineHeight: 1.4, transition: "all 0.2s" }}>
                        <span style={{ color: "#00ff9d", marginRight: 8 }}>{letter})</span>
                        {opt.substring(3)}
                        {quizAnswer !== null && isCorrect  && <span style={{ float: "right", color: "#00ff9d" }}>✓</span>}
                        {quizAnswer !== null && isSelected && !isCorrect && <span style={{ float: "right", color: "#ff5555" }}>✗</span>}
                      </button>
                    );
                  })}
                </div>

                {quizAnswer !== null && (
                  <div style={{ marginTop: 18, padding: 16, background: quizAnswer.correct ? "rgba(0,255,157,0.06)" : "rgba(255,60,60,0.06)", border: `1px solid ${quizAnswer.correct ? "rgba(0,255,157,0.25)" : "rgba(255,60,60,0.25)"}`, borderRadius: 9 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: quizAnswer.correct ? "#00ff9d" : "#ff6666", marginBottom: 8 }}>
                      {quizAnswer.correct ? "✓  CORRECT" : "✗  INCORRECT"}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(232,228,217,0.7)", lineHeight: 1.6 }}>{quizState.explanation}</div>
                    <button onClick={generateQuiz} style={{ ...btn("#00ff9d"), marginTop: 14 }}>NEXT QUESTION →</button>
                  </div>
                )}
              </div>
            )}

            {quizState?.error && (
              <div style={{ ...S.warning, borderColor: "rgba(255,60,60,0.3)", color: "#ff8888" }}>{quizState.error}</div>
            )}

            {/* History */}
            {quizHistory.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={S.label}>RECENT HISTORY</div>
                <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
                  {quizHistory.slice(0, 8).map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: q.correct ? "#00ff9d" : "#ff5555", fontSize: 13 }}>{q.correct ? "✓" : "✗"}</span>
                      <span style={{ fontSize: 11, color: "rgba(232,228,217,0.45)", flex: 1 }}>{q.question.length > 72 ? q.question.slice(0, 72) + "…" : q.question}</span>
                      <span style={{ fontSize: 10, color: "rgba(232,228,217,0.2)", whiteSpace: "nowrap" }}>Day {q.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ ANALYTICS ════════ */}
        {activeTab === "analytics" && (
          <div>
            <SectionTitle title="Performance Analytics" sub="Your CEH exam readiness at a glance" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard label="Days Done"  value={totalCompleted} total={30} color="#00ff9d" />
              <StatCard label="Questions"  value={totalQuizzes}              color="#0099ff" />
              <StatCard label="Correct"    value={totalCorrect}              color="#00ff9d" />
              <StatCard label="Accuracy"   value={`${accuracy}%`}            color={accuracy >= 70 ? "#00ff9d" : "#ff6644"} />
            </div>

            {/* Readiness bars */}
            <div style={S.card}>
              <div style={S.label}>EXAM READINESS</div>
              {[
                { label: "Study Coverage",   value: progress,  target: 100, unit: "%" },
                { label: "Quiz Accuracy",    value: accuracy,  target: 70,  unit: "%" },
              ].map(({ label, value, target, unit }) => (
                <div key={label} style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "rgba(232,228,217,0.55)" }}>{label}</span>
                    <span style={{ fontSize: 12, color: value >= target ? "#00ff9d" : "#ff6644" }}>{value}{unit} {label === "Quiz Accuracy" && "(need 70%)"}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (value / target) * 100)}%`, background: value >= target ? "#00ff9d" : "#ff6644", borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Domain scores */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.label}>DOMAIN-WISE ACCURACY</div>
              <div style={{ marginTop: 16 }}>
                {CEH_DOMAINS.slice(0, -1).map(domain => {
                  const s   = scores[domain.id] || { correct: 0, total: 0 };
                  const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
                  return (
                    <div key={domain.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 190, fontSize: 11, color: "rgba(232,228,217,0.45)", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{domain.name}</div>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: acc !== null ? `${acc}%` : "0%", background: acc !== null ? (acc >= 70 ? "#00ff9d" : "#ff6644") : "transparent", borderRadius: 2, transition: "width 0.4s" }} />
                      </div>
                      <div style={{ width: 44, textAlign: "right", fontSize: 11, color: acc !== null ? (acc >= 70 ? "#00ff9d" : "#ff6644") : "rgba(232,228,217,0.2)" }}>
                        {acc !== null ? `${acc}%` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pass prediction */}
            <div style={{ ...S.card, marginTop: 16, textAlign: "center", background: accuracy >= 70 ? "rgba(0,255,157,0.05)" : "rgba(255,100,60,0.05)", borderColor: accuracy >= 70 ? "rgba(0,255,157,0.25)" : "rgba(255,100,60,0.25)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{accuracy >= 70 ? "⬡" : "◎"}</div>
              <div style={{ fontSize: 13, letterSpacing: 2, color: accuracy >= 70 ? "#00ff9d" : "#ff8866" }}>
                {accuracy >= 70 ? "ON TRACK TO PASS CEH" : "NEEDS MORE PRACTICE"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,228,217,0.45)", marginTop: 6 }}>
                {accuracy >= 70
                  ? `You're above the 70% threshold. Keep doing 20+ questions daily.`
                  : `You need 70% to pass. Focus on red domains above and quiz daily.`}
              </div>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,157,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>{title}</h2>
      {sub && <p style={{ fontSize: 11, color: "rgba(232,228,217,0.35)", marginTop: 5, letterSpacing: 0.5 }}>{sub}</p>}
    </div>
  );
}
function Badge({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(232,228,217,0.3)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
function StatCard({ label, value, total, color, note }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
        {value}{total !== undefined && <span style={{ fontSize: 13, color: "rgba(232,228,217,0.25)" }}>/{total}</span>}
      </div>
      <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(232,228,217,0.35)", marginTop: 8 }}>{label}</div>
      {note && <div style={{ fontSize: 11, color, marginTop: 4 }}>{note}</div>}
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const btn = (c) => ({
  background: `rgba(${c === "#00ff9d" ? "0,255,157" : "0,153,255"},0.08)`,
  border: `1px solid ${c}55`, color: c, borderRadius: 7, padding: "9px 16px",
  fontSize: 11, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
});

const S = {
  root:         { minHeight: "100vh", background: "#0a0a0f", color: "#e8e4d9", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden" },
  grid:         { position: "fixed", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(#00ff9d 1px,transparent 1px),linear-gradient(90deg,#00ff9d 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  orb1:         { position: "fixed", top: "-15%", right: "-8%", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,255,157,0.06) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 },
  orb2:         { position: "fixed", bottom: "-15%", left: "-8%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,153,255,0.05) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 },
  header:       { position: "relative", zIndex: 10, borderBottom: "1px solid rgba(0,255,157,0.1)", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", flexWrap: "wrap", gap: 12 },
  headerSub:    { fontSize: 10, letterSpacing: 5, color: "#00ff9d", marginBottom: 4, opacity: 0.6 },
  headerTitle:  { fontSize: 20, fontWeight: 700, letterSpacing: 2, color: "#fff" },
  toast:        { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(0,255,157,0.12)", border: "1px solid rgba(0,255,157,0.4)", color: "#00ff9d", borderRadius: 8, padding: "10px 20px", fontSize: 12, letterSpacing: 1, zIndex: 999 },
  nav:          { position: "relative", zIndex: 10, display: "flex", gap: 0, padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,15,0.8)", overflowX: "auto" },
  navBtn:       { background: "none", border: "none", cursor: "pointer", padding: "13px 18px", fontSize: 10, letterSpacing: 3, fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  main:         { position: "relative", zIndex: 5, padding: "28px", maxWidth: 1050, margin: "0 auto" },
  statGrid:     { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 },
  card:         { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "20px 22px", marginBottom: 0 },
  domainCard:   { background: "rgba(0,255,157,0.04)", border: "1px solid rgba(0,255,157,0.18)", borderRadius: 10, padding: "22px 26px", marginBottom: 16 },
  domainName:   { fontSize: 22, fontWeight: 700, margin: "6px 0 6px" },
  domainMeta:   { fontSize: 11, color: "rgba(232,228,217,0.4)" },
  label:        { fontSize: 10, letterSpacing: 4, color: "rgba(232,228,217,0.35)" },
  scheduleRow:  { borderRadius: 9, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  todayBadge:   { fontSize: 9, letterSpacing: 2, color: "#00ff9d", border: "1px solid rgba(0,255,157,0.35)", borderRadius: 4, padding: "2px 7px" },
  tile:         { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" },
  taskRow:      { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", cursor: "pointer" },
  checkbox:     { width: 20, height: 20, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" },
  completeBanner: { background: "rgba(0,255,157,0.07)", border: "1px solid rgba(0,255,157,0.3)", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  noteItem:     { display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "rgba(0,153,255,0.05)", borderLeft: "2px solid rgba(0,153,255,0.3)", borderRadius: "0 6px 6px 0", marginBottom: 7, color: "rgba(232,228,217,0.7)" },
  input:        { flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "9px 13px", color: "#e8e4d9", fontSize: 13, fontFamily: "inherit", outline: "none" },
  loadingBox:   { background: "rgba(0,255,157,0.03)", border: "1px solid rgba(0,255,157,0.12)", borderRadius: 10, padding: 36, textAlign: "center" },
  warning:      { background: "rgba(255,165,0,0.07)", border: "1px solid rgba(255,165,0,0.25)", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#ffbb55", marginBottom: 18, lineHeight: 1.6 },
  smallBtn:     { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,228,217,0.5)", borderRadius: 6, padding: "6px 12px", fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit" },
  btnExport:    { background: "rgba(0,153,255,0.08)", border: "1px solid rgba(0,153,255,0.3)", color: "rgba(100,180,255,0.9)", borderRadius: 6, padding: "6px 13px", fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit" },
  btnReset:     { background: "none", border: "1px solid rgba(255,60,60,0.2)", color: "rgba(255,100,100,0.45)", borderRadius: 6, padding: "6px 13px", fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit" },
};
