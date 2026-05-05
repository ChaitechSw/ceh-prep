import { useState, useEffect } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

const CEH_V13_DOMAINS = [
  { id: 1,  name: "Information Security Fundamentals",        weight: 6,  days: [1, 2],       tools: ["None — theory focus"] },
  { id: 2,  name: "Reconnaissance & Footprinting",            weight: 9,  days: [3, 4, 5],    tools: ["Maltego", "Shodan", "theHarvester", "Recon-ng", "WHOIS"] },
  { id: 3,  name: "Scanning Networks",                        weight: 8,  days: [6, 7],       tools: ["Nmap", "Zenmap", "Hping3", "Angry IP Scanner"] },
  { id: 4,  name: "Enumeration",                              weight: 8,  days: [8, 9],       tools: ["Enum4linux", "NBTScan", "SNMPwalk", "Netcat", "DirBuster"] },
  { id: 5,  name: "Vulnerability Analysis",                   weight: 7,  days: [10, 11],     tools: ["Nessus", "OpenVAS", "Nikto", "Qualys", "Nexpose"] },
  { id: 6,  name: "System Hacking",                           weight: 12, days: [12, 13, 14], tools: ["Metasploit", "Mimikatz", "John the Ripper", "Hashcat", "Netcat"] },
  { id: 7,  name: "Malware Threats",                          weight: 8,  days: [15, 16],     tools: ["VirusTotal", "Any.run", "Cuckoo Sandbox", "PE Studio", "Ghidra"] },
  { id: 8,  name: "Sniffing",                                 weight: 7,  days: [17],         tools: ["Wireshark", "tcpdump", "Ettercap", "Cain & Abel", "BetterCAP"] },
  { id: 9,  name: "Social Engineering",                       weight: 7,  days: [18],         tools: ["SET", "Gophish", "BeEF", "Maltego"] },
  { id: 10, name: "Denial of Service",                        weight: 6,  days: [19],         tools: ["LOIC", "HOIC", "hping3", "Slowloris", "GoldenEye"] },
  { id: 11, name: "Session Hijacking",                        weight: 6,  days: [20],         tools: ["Burp Suite", "Wireshark", "Hamster", "Ferret", "CookieCatcher"] },
  { id: 12, name: "Evading IDS, Firewalls & Honeypots",       weight: 6,  days: [21],         tools: ["Nmap evasion", "Fragroute", "Whisker", "Proxychains", "Tor"] },
  { id: 13, name: "Hacking Web Servers & Applications",       weight: 8,  days: [22, 23],     tools: ["Burp Suite", "OWASP ZAP", "Nikto", "DirBuster", "w3af"] },
  { id: 14, name: "SQL Injection",                            weight: 5,  days: [24],         tools: ["SQLmap", "Burp Suite", "Havij", "BBQSQL"] },
  { id: 15, name: "Wireless Hacking",                         weight: 6,  days: [25],         tools: ["Aircrack-ng", "Kismet", "Wifite", "Reaver", "Fern WiFi Cracker"] },
  { id: 16, name: "Mobile & IoT Hacking",                     weight: 5,  days: [26],         tools: ["MobSF", "Drozer", "apktool", "Firmware Analysis Toolkit", "Binwalk"] },
  { id: 17, name: "Cloud Security",                           weight: 5,  days: [27],         tools: ["ScoutSuite", "Pacu", "CloudSploit", "AWS CLI", "Trivy"] },
  { id: 18, name: "Cryptography",                             weight: 5,  days: [28],         tools: ["OpenSSL", "HashCalc", "CrypTool", "VeraCrypt", "GnuPG"] },
  { id: 19, name: "AI in Ethical Hacking",                    weight: 5,  days: [29, 30],     tools: ["ChatGPT", "WormGPT", "FraudGPT", "DeepExploit", "Metasploit AI"] },
  { id: 20, name: "Full Review & Mock Exams",                 weight: 0,  days: [31, 32],     tools: ["All tools reviewed"] },
];

const DAILY_TASKS = {
  morning:   ["Read domain theory (45 min)", "Watch video walkthrough (30 min)"],
  afternoon: ["Hands-on lab / tool practice (45 min)", "Flashcard review (15 min)"],
  evening:   ["Complete 100-question quiz bank", "Log weak areas & notes"],
};

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const btn = (color) => ({
  background: `rgba(${color === "#00ff9d" ? "0,255,157" : color === "#0099ff" ? "0,153,255" : "255,165,0"},0.1)`,
  border: `1px solid ${color}55`, color, borderRadius: 8, padding: "10px 18px",
  fontSize: 11, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
});
const smallBtn = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(232,228,217,0.6)", borderRadius: 6, padding: "7px 14px",
  fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit",
};
const card = (highlight) => ({
  background: highlight ? "rgba(0,255,157,0.04)" : "rgba(255,255,255,0.02)",
  border: `1px solid ${highlight ? "rgba(0,255,157,0.25)" : "rgba(255,255,255,0.07)"}`,
  borderRadius: 12, padding: 24,
});

export default function CEHPrep() {
  const [activeTab,     setActiveTab]     = useState("dashboard");
  const [currentDay,    setCurrentDay]    = useState(() => load("ceh_day", 1));
  const [completedDays, setCompletedDays] = useState(() => load("ceh_done", {}));
  const [scores,        setScores]        = useState(() => load("ceh_scores", {}));
  const [quizHistory,   setQuizHistory]   = useState(() => load("ceh_history", []));
  const [questionBank,  setQuestionBank]  = useState(() => load("ceh_qbank", {}));
  const [notes,         setNotes]         = useState(() => load("ceh_notes", {}));
  const [noteInput,     setNoteInput]     = useState("");
  const [quizState,     setQuizState]     = useState(null);
  const [quizAnswer,    setQuizAnswer]    = useState(null);
  const [loadingQuiz,   setLoadingQuiz]   = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [genProgress,   setGenProgress]   = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  useEffect(() => save("ceh_day",     currentDay),    [currentDay]);
  useEffect(() => save("ceh_done",    completedDays), [completedDays]);
  useEffect(() => save("ceh_scores",  scores),        [scores]);
  useEffect(() => save("ceh_history", quizHistory),   [quizHistory]);
  useEffect(() => save("ceh_qbank",   questionBank),  [questionBank]);
  useEffect(() => save("ceh_notes",   notes),         [notes]);

  const domain       = CEH_V13_DOMAINS.find(d => d.days.includes(currentDay)) || CEH_V13_DOMAINS[18];
  const daysComplete = Object.keys(completedDays).filter(d => tasksDone(+d) >= 6).length;
  const totalQ       = quizHistory.length;
  const totalC       = quizHistory.filter(q => q.correct).length;
  const accuracy     = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
  const progress     = Math.round((daysComplete / 32) * 100);
  const domainBank   = questionBank[domain.id] || [];
  const bankSize     = domainBank.length;

  function tasksDone(day) {
    return Object.values(completedDays[day] || {}).filter(Boolean).length;
  }
  function isDayDone(day) { return tasksDone(day) >= 6; }

  function toggleTask(day, key) {
    setCompletedDays(prev => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [key]: !(prev[day] || {})[key] }
    }));
  }

  function saveNote() {
    if (!noteInput.trim()) return;
    setNotes(prev => ({ ...prev, [currentDay]: [...(prev[currentDay] || []), noteInput.trim()] }));
    setNoteInput("");
  }

  function resetAll() {
    if (!confirm("Reset ALL progress? This cannot be undone.")) return;
    ["ceh_day","ceh_done","ceh_scores","ceh_history","ceh_qbank","ceh_notes"].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }

  function exportProgress() {
    const domainScores = {};
    CEH_V13_DOMAINS.forEach(d => {
      const s = scores[d.id] || { correct: 0, total: 0 };
      if (s.total > 0) domainScores[d.name] = {
        accuracy: Math.round((s.correct / s.total) * 100),
        correct: s.correct, total: s.total,
        bankSize: (questionBank[d.id] || []).length,
      };
    });
    const blob = new Blob([JSON.stringify({
      currentDay, completedDays: daysComplete, accuracy,
      totalQuizzes: totalQ, totalCorrect: totalC,
      lastUpdated: new Date().toISOString(), domainScores, notes,
    }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "progress.json";
    a.click();
  }

  async function fetchBatch(batchNum) {
    const prompt = `You are a senior CEH v13 exam architect and certification instructor with 15 years of experience writing official EC-Council exam questions.

Generate exactly 5 unique, high-quality CEH v13 exam-style multiple choice questions about "${domain.name}".

Rules:
- Questions must be scenario-based, technical, and exam-level difficulty
- Include tool names, attack techniques, RFC numbers, port numbers, and countermeasures where relevant
- Wrong options must be plausible and tricky — not obviously wrong
- Cover different subtopics within "${domain.name}"
- This is batch ${batchNum} of 10 — make questions different from previous batches
- Include AI-related attack/defense scenarios if the domain is AI in Ethical Hacking

Return ONLY a valid JSON array with no markdown, no backticks, no explanation:
[
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"...","difficulty":"hard"},
  ...5 items total
]`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const text  = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found");
    return JSON.parse(match[0]);
  }

  async function generateFullBank() {
    if (!GROQ_API_KEY) {
      alert("No Groq API key found. Add VITE_GROQ_API_KEY to your .env file and restart.");
      return;
    }
    setGenerating(true);
    setGenProgress(0);
    let allQuestions = [];
    for (let batch = 1; batch <= 20; batch++) {
      try {
        const questions = await fetchBatch(batch);
        allQuestions = [...allQuestions, ...questions];
        setGenProgress(batch * 5);
        await new Promise(r => setTimeout(r, 15000));
      } catch (e) {
        console.error(`Batch ${batch} failed:`, e.message);
      }
    }
    setQuestionBank(prev => ({ ...prev, [domain.id]: allQuestions }));
    setCurrentQIndex(0);
    setQuizState(allQuestions[0] || null);
    setQuizAnswer(null);
    setGenerating(false);
  }

  function loadQuestion(index) {
    if (!domainBank[index]) return;
    setQuizState(domainBank[index]);
    setQuizAnswer(null);
    setCurrentQIndex(index);
  }

  function submitAnswer(opt) {
    if (!quizState || quizAnswer !== null) return;
    const letter  = opt.charAt(0);
    const correct = letter === quizState.correct;
    setQuizAnswer({ selected: letter, correct });
    setScores(prev => {
      const d = prev[domain.id] || { correct: 0, total: 0 };
      return { ...prev, [domain.id]: { correct: d.correct + (correct ? 1 : 0), total: d.total + 1 } };
    });
    setQuizHistory(prev => [
      { domain: domain.name, question: quizState.question, correct, day: currentDay, date: new Date().toISOString() },
      ...prev.slice(0, 999),
    ]);
  }

  function nextQuestion() {
    const next = currentQIndex + 1;
    if (next < domainBank.length) {
      loadQuestion(next);
    } else {
      setQuizState(null);
    }
  }

  const TABS = [
    { id: "dashboard", label: "Dashboard",   icon: "⬡" },
    { id: "schedule",  label: "Study Plan",  icon: "◈" },
    { id: "today",     label: "Today",       icon: "◎" },
    { id: "quiz",      label: "Quiz Bank",   icon: "⟁" },
    { id: "analytics", label: "Analytics",   icon: "▲" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e4d9", fontFamily: "'Courier New', monospace" }}>

      <div style={{ position: "fixed", inset: 0, opacity: 0.03, backgroundImage: "linear-gradient(#00ff9d 1px,transparent 1px),linear-gradient(90deg,#00ff9d 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,255,157,0.06) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <header style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid rgba(0,255,157,0.12)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 6, color: "#00ff9d", opacity: 0.7 }}>CERTIFIED ETHICAL HACKER</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>CEH <span style={{ color: "#00ff9d" }}>v13</span> PREP <span style={{ fontSize: 10, color: "#0099ff", letterSpacing: 3 }}>GROQ AI</span></div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Badge label="DAY"      value={`${currentDay}/32`}   color="#00ff9d" />
          <Badge label="DONE"     value={`${daysComplete}/32`} color="#0099ff" />
          <Badge label="ACCURACY" value={`${accuracy}%`}       color={accuracy >= 70 ? "#00ff9d" : "#ff4444"} />
          <Badge label="BANK"     value={`${bankSize}/100`}    color="#ffaa00" />
          <button onClick={exportProgress} style={{ ...smallBtn, color: "#0099ff", border: "1px solid rgba(0,153,255,0.3)" }}>⬇ EXPORT</button>
          <button onClick={resetAll}       style={{ ...smallBtn, color: "rgba(255,80,80,0.6)", border: "1px solid rgba(255,80,80,0.2)" }}>RESET</button>
        </div>
      </header>

      <nav style={{ display: "flex", padding: "0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,15,0.8)", position: "sticky", top: 65, zIndex: 99 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #00ff9d" : "2px solid transparent", color: activeTab === t.id ? "#00ff9d" : "rgba(232,228,217,0.4)", padding: "13px 20px", fontSize: 11, letterSpacing: 3, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 7 }}>
            {t.icon} {t.label.toUpperCase()}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, position: "relative", zIndex: 5 }}>

        {activeTab === "dashboard" && (
          <div>
            <H title="Mission Control" sub="CEH v13 · AI Module Included · 100 Questions Per Domain · Powered by Groq AI (Free)" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
              <StatCard label="Days Completed"     value={daysComplete} of={32}   color="#00ff9d" />
              <StatCard label="Questions Answered" value={totalQ}                  color="#0099ff" />
              <StatCard label="Quiz Accuracy"      value={`${accuracy}%`}          color={accuracy >= 70 ? "#00ff9d" : "#ff6644"} note={accuracy < 70 ? "Need 70% to pass" : "On track!"} />
              <StatCard label="Bank Generated"     value={`${bankSize}/100`}       color="#ffaa00" note="for today's domain" />
            </div>

            <div style={{ ...card(true), marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#00ff9d", marginBottom: 6 }}>TODAY — DAY {currentDay}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{domain.name}</div>
              <div style={{ fontSize: 12, color: "rgba(232,228,217,0.45)", marginBottom: 6 }}>Exam weight: {domain.weight}%</div>
              <div style={{ fontSize: 12, color: "rgba(0,153,255,0.7)", marginBottom: 16 }}>Tools: {domain.tools.join(", ")}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => setActiveTab("today")}                              style={btn("#00ff9d")}>START TODAY'S STUDY →</button>
                <button onClick={() => { setActiveTab("quiz"); }}                          style={btn("#0099ff")}>OPEN QUIZ BANK ⟁</button>
                <button onClick={() => { setActiveTab("quiz"); generateFullBank(); }}      style={btn("#ffaa00")}>⚡ GENERATE 100 QUESTIONS</button>
              </div>
            </div>

            <div style={{ ...card(false), marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "rgba(232,228,217,0.4)", marginBottom: 14 }}>32-DAY PROGRESS MAP</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Array.from({ length: 32 }, (_, i) => i + 1).map(d => (
                  <button key={d} onClick={() => setCurrentDay(d)} title={`Day ${d}`} style={{ width: 36, height: 36, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: isDayDone(d) ? 700 : 400, background: isDayDone(d) ? "#00ff9d" : d === currentDay ? "rgba(0,255,157,0.15)" : "rgba(255,255,255,0.04)", color: isDayDone(d) ? "#0a0a0f" : d === currentDay ? "#00ff9d" : "rgba(232,228,217,0.3)", border: d === currentDay ? "1px solid #00ff9d" : "1px solid rgba(255,255,255,0.06)", transition: "all 0.15s" }}>
                    {isDayDone(d) ? "✓" : d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { icon: "◉", t: "CEH v13 Exam Format",  i: "125 MCQ · 4 hours · 70% to pass · Pearson VUE" },
                { icon: "◈", t: "AI Module (New v13)",   i: "WormGPT, FraudGPT, AI-powered attacks & defenses" },
                { icon: "▲", t: "Key Strategy",          i: "Tool names, attack phases, port numbers, countermeasures" },
                { icon: "⟁", t: "Quiz Bank Target",      i: "100 questions per domain · aim for 75%+ accuracy" },
              ].map(x => (
                <div key={x.t} style={{ ...card(false), display: "flex", gap: 12, padding: 16 }}>
                  <span style={{ fontSize: 18, color: "#00ff9d" }}>{x.icon}</span>
                  <div><div style={{ fontSize: 10, letterSpacing: 2, color: "#00ff9d", marginBottom: 3 }}>{x.t}</div><div style={{ fontSize: 13, color: "rgba(232,228,217,0.55)", lineHeight: 1.5 }}>{x.i}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            <H title="32-Day CEH v13 Study Plan" sub="AI Module included · Domain coverage weighted by exam percentages" />
            <div style={{ display: "grid", gap: 8 }}>
              {CEH_V13_DOMAINS.map(d => {
                const active   = d.days.includes(currentDay);
                const complete = d.days.every(day => isDayDone(day));
                const s        = scores[d.id] || { correct: 0, total: 0 };
                const acc      = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
                return (
                  <div key={d.id} style={{ background: active ? "rgba(0,255,157,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${active ? "rgba(0,255,157,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: complete ? "#00ff9d" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: complete ? "#0a0a0f" : "rgba(232,228,217,0.3)", flexShrink: 0 }}>{complete ? "✓" : d.id}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}{d.id === 19 && <span style={{ marginLeft: 8, fontSize: 9, color: "#ffaa00", border: "1px solid #ffaa0055", borderRadius: 4, padding: "2px 6px", letterSpacing: 2 }}>NEW v13</span>}</div>
                          <div style={{ fontSize: 11, color: "rgba(232,228,217,0.38)", marginTop: 2 }}>Day{d.days.length > 1 ? "s" : ""} {d.days.join(", ")}{d.weight > 0 && ` · ${d.weight}% exam`}</div>
                          <div style={{ fontSize: 10, color: "rgba(0,153,255,0.5)", marginTop: 2 }}>{d.tools.slice(0,3).join(", ")}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {acc !== null && <span style={{ fontSize: 11, color: acc >= 70 ? "#00ff9d" : "#ff6644" }}>{acc}%</span>}
                        {active && <span style={{ fontSize: 9, letterSpacing: 2, color: "#00ff9d", border: "1px solid rgba(0,255,157,0.4)", borderRadius: 4, padding: "3px 7px" }}>TODAY</span>}
                        {d.weight > 0 && <div style={{ width: 70, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}><div style={{ width: `${(d.weight / 12) * 100}%`, height: "100%", background: "#00ff9d", borderRadius: 2 }} /></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "today" && (
          <div>
            <H title={`Day ${currentDay}: ${domain.name}`} sub="Check off each task as you complete it — saved automatically" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <button onClick={() => setCurrentDay(d => Math.max(1, d - 1))}  style={smallBtn}>← PREV</button>
              <span style={{ fontSize: 11, color: "rgba(232,228,217,0.4)" }}>Day {currentDay} of 32</span>
              <button onClick={() => setCurrentDay(d => Math.min(32, d + 1))} style={smallBtn}>NEXT →</button>
            </div>

            <div style={{ ...card(false), marginBottom: 20, padding: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#0099ff", marginBottom: 10 }}>🛠 TOOLS FOR TODAY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {domain.tools.map(tool => (
                  <span key={tool} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(0,153,255,0.08)", border: "1px solid rgba(0,153,255,0.25)", borderRadius: 20, color: "#0099ff" }}>{tool}</span>
                ))}
              </div>
            </div>

            {[
              { session: "🌅 MORNING SESSION",    tasks: DAILY_TASKS.morning,   si: 0 },
              { session: "☀️  AFTERNOON SESSION", tasks: DAILY_TASKS.afternoon, si: 1 },
              { session: "🌙 EVENING SESSION",    tasks: DAILY_TASKS.evening,   si: 2 },
            ].map(({ session, tasks, si }) => (
              <div key={session} style={{ ...card(false), marginBottom: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#00ff9d", marginBottom: 14 }}>{session}</div>
                {tasks.map((task, ti) => {
                  const key  = `${si}-${ti}`;
                  const done = (completedDays[currentDay] || {})[key];
                  return (
                    <div key={key} onClick={() => toggleTask(currentDay, key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: ti < tasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: done ? "none" : "1px solid rgba(0,255,157,0.3)", background: done ? "#00ff9d" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {done && <span style={{ fontSize: 11, color: "#0a0a0f", fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: done ? "rgba(232,228,217,0.3)" : "#e8e4d9", textDecoration: done ? "line-through" : "none" }}>{task}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {isDayDone(currentDay) && (
              <div style={{ background: "rgba(0,255,157,0.08)", border: "1px solid rgba(0,255,157,0.4)", borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>⬡</div>
                <div style={{ fontSize: 13, color: "#00ff9d", letterSpacing: 2 }}>DAY {currentDay} COMPLETE — SAVED ✓</div>
                <div style={{ fontSize: 11, color: "rgba(232,228,217,0.4)", marginTop: 4 }}>{32 - currentDay} days remaining · Export progress and run commit script</div>
              </div>
            )}

            <div style={card(false)}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#0099ff", marginBottom: 14 }}>◈ TODAY'S NOTES</div>
              {(notes[currentDay] || []).map((n, i) => (
                <div key={i} style={{ padding: "7px 12px", background: "rgba(0,153,255,0.05)", borderLeft: "2px solid rgba(0,153,255,0.35)", marginBottom: 7, fontSize: 12, color: "rgba(232,228,217,0.65)", borderRadius: "0 6px 6px 0" }}>{n}</div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveNote()} placeholder="Type a note and press Enter..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 13px", color: "#e8e4d9", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <button onClick={saveNote} style={btn("#0099ff")}>SAVE</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quiz" && (
          <div>
            <H title="CEH v13 Quiz Bank" sub={`Senior Exam Architect Level · 100 Questions · Domain: ${domain.name}`} />

            {!GROQ_API_KEY && (
              <div style={{ background: "rgba(255,165,0,0.07)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: 10, padding: 18, marginBottom: 20, fontSize: 13, color: "#ffaa44", lineHeight: 1.7 }}>
                ⚠️ <strong>Groq API key not found.</strong><br />
                1. Get a free key at <strong>console.groq.com</strong><br />
                2. Add <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 4 }}>VITE_GROQ_API_KEY=gsk_...</code> to your <code>.env</code> file<br />
                3. Restart with <code>npm run dev</code>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={generateFullBank} disabled={generating} style={btn("#ffaa00")}>
                {generating ? `⟳ GENERATING... ${genProgress}/100` : `⚡ GENERATE 100 QUESTIONS`}
              </button>
              {bankSize > 0 && <span style={{ fontSize: 11, color: "rgba(232,228,217,0.35)" }}>{bankSize} questions ready · question {currentQIndex + 1} of {bankSize}</span>}
            </div>

            {generating && (
              <div style={{ ...card(true), marginBottom: 20, padding: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#ffaa00", marginBottom: 10 }}>GENERATING QUESTION BANK — {genProgress}/100</div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                  <div style={{ width: `${genProgress}%`, height: "100%", background: "#ffaa00", borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 11, color: "rgba(232,228,217,0.4)", marginTop: 10 }}>Calling Groq AI in batches of 10 · Please wait ~60 seconds</div>
              </div>
            )}

            {bankSize > 0 && !generating && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {domainBank.map((_, i) => {
                  const answered = quizHistory.find(h => h.domain === domain.name && h.question === domainBank[i]?.question);
                  return (
                    <button key={i} onClick={() => loadQuestion(i)} style={{ width: 32, height: 32, borderRadius: 5, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 10, background: i === currentQIndex ? "#00ff9d" : answered ? (answered.correct ? "rgba(0,255,157,0.2)" : "rgba(255,68,68,0.2)") : "rgba(255,255,255,0.05)", color: i === currentQIndex ? "#0a0a0f" : "rgba(232,228,217,0.5)" }}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            )}

            {quizState && !quizState.error && !generating && (
              <div style={card(false)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#0099ff" }}>Q{currentQIndex + 1} · {domain.name.toUpperCase()}</div>
                  {quizState.difficulty && <span style={{ fontSize: 9, letterSpacing: 2, color: "#ff4444", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 4, padding: "2px 7px" }}>{quizState.difficulty.toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 22, color: "#fff" }}>{quizState.question}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {quizState.options?.map(opt => {
                    const L = opt.charAt(0), sel = quizAnswer?.selected === L, correct = quizState.correct === L;
                    let bg = "rgba(255,255,255,0.03)", border = "1px solid rgba(255,255,255,0.08)";
                    if (quizAnswer) {
                      if (correct)  { bg = "rgba(0,255,157,0.1)";  border = "1px solid rgba(0,255,157,0.45)"; }
                      else if (sel) { bg = "rgba(255,68,68,0.1)";  border = "1px solid rgba(255,68,68,0.45)"; }
                    }
                    return (
                      <button key={opt} onClick={() => submitAnswer(opt)} disabled={!!quizAnswer} style={{ background: bg, border, borderRadius: 9, padding: "13px 16px", textAlign: "left", cursor: quizAnswer ? "default" : "pointer", color: "#e8e4d9", fontSize: 13, fontFamily: "inherit", lineHeight: 1.4 }}>
                        <span style={{ color: "#00ff9d", marginRight: 8 }}>{L})</span>{opt.substring(3)}
                        {quizAnswer && correct && <span style={{ float: "right", color: "#00ff9d" }}>✓</span>}
                        {quizAnswer && sel && !correct && <span style={{ float: "right", color: "#ff4444" }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
                {quizAnswer && (
                  <div style={{ marginTop: 18, padding: 16, background: quizAnswer.correct ? "rgba(0,255,157,0.06)" : "rgba(255,68,68,0.06)", border: `1px solid ${quizAnswer.correct ? "rgba(0,255,157,0.2)" : "rgba(255,68,68,0.2)"}`, borderRadius: 9 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: quizAnswer.correct ? "#00ff9d" : "#ff4444", marginBottom: 8 }}>{quizAnswer.correct ? "✓ CORRECT" : "✗ INCORRECT"}</div>
                    <div style={{ fontSize: 12, color: "rgba(232,228,217,0.65)", lineHeight: 1.65 }}>{quizState.explanation}</div>
                    <button onClick={nextQuestion} style={{ ...btn("#00ff9d"), marginTop: 14 }}>
                      {currentQIndex + 1 < bankSize ? `NEXT QUESTION → (${currentQIndex + 2}/${bankSize})` : "✓ BANK COMPLETE"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {bankSize === 0 && !generating && (
              <div style={{ ...card(false), textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⟁</div>
                <div style={{ fontSize: 13, color: "rgba(232,228,217,0.4)", marginBottom: 16 }}>No questions generated yet for this domain</div>
                <button onClick={generateFullBank} style={btn("#ffaa00")}>⚡ GENERATE 100 QUESTIONS NOW</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <H title="Performance Analytics" sub="CEH v13 exam readiness across all 19 domains" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard label="Days Done"  value={daysComplete} of={32} color="#00ff9d" />
              <StatCard label="Questions"  value={totalQ}               color="#0099ff" />
              <StatCard label="Correct"    value={totalC}               color="#00ff9d" />
              <StatCard label="Accuracy"   value={`${accuracy}%`}       color={accuracy >= 70 ? "#00ff9d" : "#ff6644"} />
            </div>

            <div style={{ ...card(false), marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "rgba(232,228,217,0.35)", marginBottom: 18 }}>EXAM READINESS</div>
              {[
                { label: "Study Coverage", value: progress, target: 100 },
                { label: "Quiz Accuracy",  value: accuracy, target: 70  },
              ].map(({ label, value, target }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "rgba(232,228,217,0.55)" }}>{label}</span>
                    <span style={{ fontSize: 11, color: "#00ff9d" }}>{value}%{label.includes("Accuracy") && " (target: 70%)"}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: value >= target * 0.8 ? "#00ff9d" : "#ff6644", borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={card(false)}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "rgba(232,228,217,0.35)", marginBottom: 18 }}>DOMAIN QUIZ SCORES</div>
              {CEH_V13_DOMAINS.slice(0, -1).map(d => {
                const s   = scores[d.id] || { correct: 0, total: 0 };
                const a   = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
                const bk  = (questionBank[d.id] || []).length;
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 200, fontSize: 10, color: "rgba(232,228,217,0.45)", flexShrink: 0 }}>
                      {d.name.length > 28 ? d.name.substring(0, 28) + "…" : d.name}
                      {d.id === 19 && <span style={{ marginLeft: 4, fontSize: 8, color: "#ffaa00" }}>AI</span>}
                    </div>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ width: a !== null ? `${a}%` : "0%", height: "100%", background: a !== null ? (a >= 70 ? "#00ff9d" : "#ff6644") : "transparent", borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ width: 45, textAlign: "right", fontSize: 11, color: a !== null ? (a >= 70 ? "#00ff9d" : "#ff6644") : "rgba(232,228,217,0.18)" }}>{a !== null ? `${a}%` : "—"}</div>
                    <div style={{ fontSize: 10, color: "rgba(232,228,217,0.2)", width: 50, textAlign: "right" }}>{s.total > 0 ? `${s.correct}/${s.total}` : ""}</div>
                    <div style={{ fontSize: 9, color: "#ffaa0066", width: 45, textAlign: "right" }}>{bk > 0 ? `${bk}Q` : ""}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18, background: accuracy >= 70 ? "rgba(0,255,157,0.06)" : "rgba(255,100,68,0.06)", border: `1px solid ${accuracy >= 70 ? "rgba(0,255,157,0.3)" : "rgba(255,100,68,0.3)"}`, borderRadius: 12, padding: 22, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{accuracy >= 70 ? "⬡" : "◎"}</div>
              <div style={{ fontSize: 13, letterSpacing: 2, color: accuracy >= 70 ? "#00ff9d" : "#ff8866", marginBottom: 5 }}>{accuracy >= 70 ? "ON TRACK TO PASS CEH v13" : "NEEDS MORE PRACTICE"}</div>
              <div style={{ fontSize: 12, color: "rgba(232,228,217,0.45)" }}>{accuracy >= 70 ? "Above 70% threshold. Stay consistent and cover the AI module." : `${70 - accuracy}% gap to close. Focus on weak domains and complete question banks.`}</div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(232,228,217,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,157,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}

function H({ title, sub }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: 1, margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 11, color: "rgba(232,228,217,0.38)", letterSpacing: 1, marginTop: 5, marginBottom: 0 }}>{sub}</p>}
    </div>
  );
}

function Badge({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(232,228,217,0.3)", marginTop: 1 }}>{label}</div>
    </div>
  );
}

function StatCard({ label, value, of: ofVal, color, note }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 22px" }}>
      <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>
        {value}{ofVal !== undefined && <span style={{ fontSize: 13, color: "rgba(232,228,217,0.25)" }}>/{ofVal}</span>}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(232,228,217,0.38)", marginTop: 7 }}>{label}</div>
      {note && <div style={{ fontSize: 10, color, marginTop: 3 }}>{note}</div>}
    </div>
  );
}
