"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowRight, Building2, Check, ClipboardList, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { useCampusAuth } from "@/components/auth-provider";
import { getFirebaseClient } from "@/lib/firebase/client";

type Complaint = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  category?: string;
  status: string;
  department?: string;
  priority?: string;
  createdAt?: { toMillis?: () => number };
};

const departments = ["Facilities", "IT Department", "Hostel Office", "Classroom Services", "Housekeeping", "Campus Security"];
const statuses = ["Submitted", "Under Review", "In Progress", "Resolved", "Closed"];
const priorities = ["Low", "Medium", "High", "Urgent"];

type TriageSuggestion = { category: string; department: string; priority: string; reason: string };
type AiTriage = TriageSuggestion & { safetyFlag: boolean };
type WeeklyAnalysis = {
  summary: string;
  recurringProblems: { label: string; count: number; evidence: string }[];
  priorityConcerns: string[];
  recommendedActions: string[];
  resolutionInsight: string;
};

function suggestTriage(complaint: Complaint): TriageSuggestion {
  const text = `${complaint.title} ${complaint.description}`.toLowerCase();
  const duration = /\b(two|three|four|several|multiple|\d+)\s+(day|days|week|weeks|hour|hours)\b|since\s+(yesterday|\w+day|\w+ evening)|repeatedly|keeps?\s+(happening|failing|cutting)/i.test(text);
  const emergency = /\b(fire|smoke|sparking|exposed wire|electric shock|gas leak|injury|injured|flooding|structural collapse)\b/i.test(text);
  let category = complaint.category || "General campus issue";
  let department = "Facilities";
  let priority = duration ? "High" : "Medium";
  let reason = duration
    ? "The report describes an issue lasting multiple days or recurring, so it may need quicker follow-up."
    : "No immediate safety risk or extended outage was detected; review and adjust based on campus impact.";

  if (/wi[ -]?fi|wireless|internet|network|connectivity|router|bandwidth/.test(text)) {
    category = "Network / Wi-Fi";
    department = "IT Department";
    priority = duration ? "High" : "Medium";
    reason = duration
      ? "The network issue has lasted or recurred over time, which can affect students across the hostel or campus."
      : "The report describes a network or Wi-Fi issue; IT can check the connection and access point.";
  } else if (/light|electric|electrical|power|outlet|socket|wiring|circuit|fan/.test(text)) {
    category = "Electrical";
    department = "Facilities";
    priority = emergency ? "Urgent" : duration ? "High" : "Medium";
    reason = emergency
      ? "The report includes a possible electrical safety hazard and should be checked immediately."
      : duration ? "The electrical issue is ongoing or recurring and may disrupt rooms or classes." : "Facilities is the likely team for this electrical repair.";
  } else if (/hostel|dorm|residence|roommate|warden/.test(text)) {
    category = "Hostel";
    department = "Hostel Office";
    reason = "The report concerns hostel living or accommodation, so the Hostel Office is the likely first contact.";
  } else if (/classroom|lecture hall|projector|blackboard|desk|class room/.test(text)) {
    category = "Classroom";
    department = "Classroom Services";
    reason = "The issue is reported in a teaching space, so Classroom Services is the likely team.";
  } else if (/clean|garbage|trash|waste|bin|litter|sanitation|dirty|overflowing/.test(text)) {
    category = "Cleanliness";
    department = "Housekeeping";
    priority = duration ? "High" : "Low";
    reason = duration ? "The cleanliness issue appears unresolved over time and may need prompt housekeeping follow-up." : "This appears to be a cleaning or waste collection request for Housekeeping.";
  } else if (/security|theft|stolen|harass|threat|unsafe|suspicious/.test(text)) {
    category = "Campus Security";
    department = "Campus Security";
    priority = "High";
    reason = "The report mentions a safety or security concern and should be reviewed promptly by Campus Security.";
  } else if (/leak|plumb|water|pipe|drain|toilet|tap|flood/.test(text)) {
    category = "Plumbing / Water";
    department = "Facilities";
    priority = emergency ? "Urgent" : duration ? "High" : "Medium";
    reason = emergency ? "The report suggests active flooding or damage and may require immediate Facilities attention." : "Facilities is the likely team for a water or plumbing repair.";
  }

  if (emergency && priority !== "Urgent") {
    priority = "Urgent";
    reason = "A possible immediate safety risk was detected; have staff review it urgently.";
  }
  return { category, department, priority, reason };
}

const demoComplaints: Complaint[] = [
  { id: "DEMO-1042", studentId: "demo-student-1", title: "Hostel Wi-Fi has been down for two days", description: "The network is unavailable on the second floor of Maple Hostel since Monday evening.", category: "Network / Wi-Fi", status: "Submitted", priority: "High", department: "IT Department" },
  { id: "DEMO-1038", studentId: "demo-student-2", title: "Lights flickering in Room B214", description: "The ceiling lights keep cutting out during evening classes.", category: "Electrical", status: "In Progress", priority: "Medium", department: "Facilities" },
  { id: "DEMO-1031", studentId: "demo-student-3", title: "Overflowing bins near the library entrance", description: "Waste bins have not been collected since yesterday afternoon.", category: "Cleanliness", status: "Under Review", priority: "Low", department: "Housekeeping" },
];

export function AdminPortal() {
  const searchParams = useSearchParams();
  const { user, profile, loading, error: authError, logOut } = useCampusAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");
  const demoMode = process.env.NODE_ENV === "development" && searchParams.get("demo") === "1";

  useEffect(() => {
    if (demoMode || profile?.role !== "admin") return;
    const db = getFirebaseClient().db;
    const allComplaints = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    return onSnapshot(allComplaints, (snapshot) => {
      setComplaints(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Complaint));
      setLoadError("");
    }, (cause) => setLoadError(cause.message || "Could not load campus reports."));
  }, [demoMode, profile]);

  const visibleComplaints = demoMode ? demoComplaints : complaints;
  const openCount = useMemo(() => visibleComplaints.filter((item) => !["Resolved", "Closed"].includes(item.status)).length, [visibleComplaints]);
  const urgentCount = useMemo(() => visibleComplaints.filter((item) => ["High", "Urgent"].includes(item.priority || "")).length, [visibleComplaints]);

  async function generateWeeklyAnalysis() {
    setWeeklyLoading(true);
    setWeeklyError("");
    try {
      if (demoMode || !user) throw new Error("Sign in with an authorized administrator account to generate a Gemini report.");
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = complaints.filter((item) => (item.createdAt?.toMillis?.() ?? 0) >= cutoff).slice(0, 80);
      if (!recent.length) throw new Error("There are no dated reports from the last seven days to summarize yet.");
      const response = await fetch("/api/ai/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ mode: "weekly", complaints: recent.map((item) => ({
          title: item.title, description: item.description, category: item.category, status: item.status,
          department: item.department, priority: item.priority,
          createdAt: item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toISOString() : "",
        })) }),
      });
      const result = await response.json() as { analysis?: WeeklyAnalysis; error?: string };
      if (!response.ok || !result.analysis) throw new Error(result.error || "Gemini could not create the weekly report.");
      setWeeklyAnalysis(result.analysis);
    } catch (cause) {
      setWeeklyError(cause instanceof Error ? cause.message : "Could not generate the weekly report.");
    } finally {
      setWeeklyLoading(false);
    }
  }

  // Local-only demo data; the effect above skips Firestore while demoMode is active.
  if (!demoMode && loading) return <main className="admin-gate"><div className="admin-gate-card">Loading admin access…</div></main>;

  if (!demoMode && (!user || !profile)) {
    return <main className="admin-gate"><div className="admin-gate-card"><Link href="/" className="admin-brand"><BrandMark /> CampusFix</Link><div className="admin-gate-icon"><ShieldCheck size={23} /></div><span className="admin-eyebrow">CAMPUS OPERATIONS</span><h1>Administrator sign in</h1><p>Sign in with the Google account assigned an administrator role by your Firebase project administrator.</p>{authError && <div className="admin-error">{authError}</div>}<Link href="/login?portal=admin" className="admin-primary-link">Continue to admin sign in <ArrowRight size={16} /></Link><Link href="/" className="admin-back-link">Back to CampusFix</Link></div></main>;
  }

  if (!demoMode && profile?.role !== "admin") {
    return <main className="admin-gate"><div className="admin-gate-card"><div className="admin-gate-icon"><ShieldCheck size={23} /></div><span className="admin-eyebrow">ACCESS RESTRICTED</span><h1>Admin access isn’t assigned.</h1><p>This Google account is signed in as a student. Ask a trusted Firebase project administrator to grant your account the admin role.</p><button className="admin-primary-link" onClick={() => void logOut()}>Sign out</button><Link href="/student" className="admin-back-link">Open student portal</Link></div></main>;
  }

  const displayName = demoMode ? "Demo Administrator" : profile!.name;
  const displayEmail = demoMode ? "Preview only · no Firebase account" : profile!.email;

  return <main className="admin-app">
    <aside className="admin-sidebar"><Link href="/" className="admin-brand"><BrandMark /> CampusFix</Link><span className="admin-sidebar-label">WORKSPACE</span><a className="admin-nav-active" href="#queue"><ClipboardList size={16} /> Report queue <span>{visibleComplaints.length}</span></a><a href="#queue"><Building2 size={16} /> Department dispatch</a><div className="admin-sidebar-bottom"><div className="admin-profile"><span className="admin-avatar">{displayName.slice(0, 1).toUpperCase()}</span><div><b>{displayName}</b><small>{demoMode ? "Local preview" : "Campus administrator"}</small></div></div>{demoMode ? <Link className="admin-demo-exit" href="/login?portal=admin">Exit demo preview</Link> : <button onClick={() => void logOut()}><LogOut size={15} /> Sign out</button>}</div></aside>
    <section className="admin-main"><header className="admin-header"><div><span className="admin-eyebrow">CAMPUS OPERATIONS <i /> {demoMode ? "LOCAL DEMO" : "LIVE QUEUE"}</span><h1>Dispatch dashboard</h1><p>Review incoming reports and coordinate the right campus response.</p>{demoMode && <span className="admin-demo-tag">Preview data only · changes are not saved</span>}</div><span className="admin-live"><i /> {demoMode ? "DEMO MODE" : "CONNECTED"}</span></header>
      <section className="admin-ai-panel"><div className="admin-ai-intro"><span className="admin-ai-icon"><Sparkles size={16} /></span><div><span className="admin-eyebrow">GEMMA 4 CAMPUS BRIEFING</span><h2>Recurring issues &amp; weekly report</h2><p>Find related complaints, emerging patterns, safety concerns, and recommended next steps from the past seven days.</p></div><button type="button" onClick={() => void generateWeeklyAnalysis()} disabled={weeklyLoading || demoMode}>{weeklyLoading ? "Analyzing…" : "Generate AI report"}</button></div>{demoMode && <p className="admin-ai-hint">Sign in as an authorized admin to run Gemma 4 analysis on live reports.</p>}{weeklyError && <div className="admin-error">{weeklyError}</div>}{weeklyAnalysis && <div className="admin-ai-results"><p className="admin-ai-summary">{weeklyAnalysis.summary}</p>{weeklyAnalysis.recurringProblems.length > 0 && <div><b>Recurring patterns</b><ul>{weeklyAnalysis.recurringProblems.map((item, index) => <li key={`${item.label}-${index}`}><strong>{item.label}</strong> · {item.count} related {item.count === 1 ? "report" : "reports"}<small>{item.evidence}</small></li>)}</ul></div>}{weeklyAnalysis.priorityConcerns.length > 0 && <div><b>Needs attention</b><ul>{weeklyAnalysis.priorityConcerns.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}{weeklyAnalysis.recommendedActions.length > 0 && <div><b>Suggested next steps</b><ul>{weeklyAnalysis.recommendedActions.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}<p className="admin-ai-hint">{weeklyAnalysis.resolutionInsight}</p></div>}</section>
      <div className="admin-metrics"><article><span>ALL REPORTS</span><b>{visibleComplaints.length}</b><small>In the campus queue</small></article><article><span>AWAITING RESOLUTION</span><b>{openCount}</b><small>Open reports</small></article><article><span>HIGH PRIORITY</span><b>{urgentCount}</b><small>Needs closer attention</small></article></div>
      <section className="admin-queue" id="queue"><div className="admin-queue-heading"><div><span className="admin-eyebrow">INCOMING &amp; ACTIVE</span><h2>Report queue</h2></div><span className="admin-queue-count">{visibleComplaints.length} REPORTS</span></div>{!demoMode && loadError ? <div className="admin-error">Could not load reports: {loadError}</div> : visibleComplaints.length === 0 ? <div className="admin-empty"><span><ClipboardList size={22} /></span><h3>The queue is clear.</h3><p>New student reports will appear here as they are submitted.</p></div> : <div className="admin-report-list">{visibleComplaints.map((complaint) => <DispatchCard key={complaint.id} complaint={complaint} user={user} demoMode={demoMode} onSaved={() => { setSavedMessage(demoMode ? "Demo preview only: this change was not saved." : "Dispatch update saved."); window.setTimeout(() => setSavedMessage(""), 2600); }} />)}</div>}</section>
      {savedMessage && <div className="admin-toast"><Check size={15} /> {savedMessage}</div>}
      <footer className="admin-footer"><Link href="/">CampusFix</Link><span>Campus care, with follow-through.</span><span>{displayEmail}</span></footer>
    </section>
  </main>;
}

function DispatchCard({ complaint, user, demoMode, onSaved }: { complaint: Complaint; user: ReturnType<typeof useCampusAuth>["user"]; demoMode: boolean; onSaved: () => void }) {
  const [department, setDepartment] = useState(complaint.department || "");
  const [priority, setPriority] = useState(complaint.priority || "Medium");
  const [status, setStatus] = useState(complaint.status || "Submitted");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<AiTriage | null>(null);
  const suggestion = useMemo(() => suggestTriage(complaint), [complaint]);

  async function analyzeWithGemini() {
    setAiLoading(true);
    setAiError("");
    try {
      if (demoMode || !user) throw new Error("Sign in with an authorized administrator account to use Gemini.");
      const response = await fetch("/api/ai/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ mode: "triage", complaint: { title: complaint.title, description: complaint.description, category: complaint.category } }),
      });
      const result = await response.json() as { analysis?: AiTriage; error?: string };
      if (!response.ok || !result.analysis) throw new Error(result.error || "Gemini could not analyze this report.");
      setAiSuggestion(result.analysis);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "Could not analyze this report.");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveDispatch() {
    setSaving(true);
    setError("");
    try {
      if (demoMode) {
        onSaved();
        return;
      }
      await updateDoc(doc(getFirebaseClient().db, "complaints", complaint.id), {
        department: department || "Unassigned",
        priority,
        status,
        updatedAt: serverTimestamp(),
      });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save dispatch changes.");
    } finally {
      setSaving(false);
    }
  }

  const shownSuggestion = aiSuggestion || suggestion;
  return <article className="admin-report-card"><div className="admin-report-top"><div><span className="admin-category">{complaint.category || "CAMPUS ISSUE"} <i /> {complaint.id.slice(0, 7).toUpperCase()}</span><h3>{complaint.title || "Untitled campus report"}</h3><p>{complaint.description}</p></div><span className={`admin-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span></div><section className="admin-triage" aria-label="Triage suggestion"><div className="admin-triage-heading"><span className="admin-triage-spark"><Sparkles size={13} /></span><div><b>{aiSuggestion ? "Gemma 4 suggestion" : "Quick triage suggestion"}</b><small>{aiSuggestion ? "AI reviewed this report · admin approval required" : "Quick text matching · ask Gemma 4 for deeper analysis"}</small></div><button type="button" onClick={() => void analyzeWithGemini()} disabled={aiLoading || demoMode}>{aiLoading ? "Analyzing…" : "Analyze with AI"}</button></div><div className="admin-triage-pills"><span>{shownSuggestion.category}</span><span className={`priority-${shownSuggestion.priority.toLowerCase()}`}>{shownSuggestion.priority} priority</span><span>{shownSuggestion.department}</span>{aiSuggestion?.safetyFlag && <span className="priority-urgent">Safety concern</span>}</div><p>{shownSuggestion.reason}</p><button type="button" className="admin-ai-apply" onClick={() => { setDepartment(shownSuggestion.department); setPriority(shownSuggestion.priority); }}>Apply recommendation</button>{aiError && <div className="admin-error">{aiError}</div>}</section><div className="admin-dispatch-controls"><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Unassigned</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><button onClick={() => void saveDispatch()} disabled={saving}>{saving ? "Saving…" : "Save update"}</button></div>{error && <div className="admin-error">{error}</div>}</article>;
}

function BrandMark() {
  return <span className="brand-icon"><span /><span /><span /></span>;
}
