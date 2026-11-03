"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { ArrowLeft, ArrowRight, ClipboardList, LogOut, Plus, ShieldCheck } from "lucide-react";
import { useCampusAuth } from "@/components/auth-provider";
import { getFirebaseClient } from "@/lib/firebase/client";

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt?: { toMillis?: () => number };
};

const categories = ["Electrical", "Network / Wi-Fi", "Hostel", "Classroom", "Cleanliness", "Other"];
const demoStudent: { uid: string; name: string; email: string; role: "student" } = {
  uid: "demo-student", name: "Aarav Sharma", email: "student-preview@campusfix.local", role: "student",
};
const demoReports: Complaint[] = [
  { id: "DEMO-1042", title: "Hostel Wi-Fi has been down for two days", description: "The network is unavailable on the second floor of Maple Hostel since Monday evening.", category: "Network / Wi-Fi", status: "In Progress" },
  { id: "DEMO-1017", title: "Water cooler near the library is leaking", description: "Water is pooling on the floor beside the east entrance.", category: "Hostel", status: "Submitted" },
];

export function StudentPortal() {
  const searchParams = useSearchParams();
  const { user, profile, loading, error: authError, logOut } = useCampusAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const demoMode = process.env.NODE_ENV === "development" && searchParams.get("demo") === "1";

  useEffect(() => {
    if (demoMode || !profile || profile.role !== "student") return;
    const { db } = getFirebaseClient();
    const reports = query(collection(db, "complaints"), where("studentId", "==", profile.uid));
    return onSnapshot(reports, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Complaint);
      items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setComplaints(items);
      setLoadError("");
    }, (cause) => setLoadError(cause.message || "Could not load your reports."));
  }, [demoMode, profile]);

  const visibleProfile = demoMode ? demoStudent : profile;
  const visibleComplaints = useMemo(() => demoMode ? [...complaints, ...demoReports] : complaints, [demoMode, complaints]);
  const openCount = useMemo(() => visibleComplaints.filter((item) => !["Resolved", "Closed"].includes(item.status)).length, [visibleComplaints]);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((!demoMode && !profile) || (!demoMode && profile?.role !== "student")) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const category = String(form.get("category") || "Other");
    if (!title || !description) {
      setFormError("Add a short title and describe what happened.");
      return;
    }
    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      if (demoMode) {
        setComplaints((items) => [{
          id: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
          title,
          description,
          category,
          status: "Submitted",
        }, ...items]);
        formElement.reset();
        setSuccess("Demo report added locally. It was not sent to Firebase.");
        setShowForm(false);
        return;
      }
      if (!profile) return;
      await addDoc(collection(getFirebaseClient().db, "complaints"), {
        studentId: profile.uid,
        title,
        description,
        category,
        status: "Submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      formElement.reset();
      setSuccess("Your report was submitted. You can follow its status below.");
      setShowForm(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Your report could not be submitted.");
    } finally {
      setSaving(false);
    }
  }

  if (!demoMode && loading) return <main className="student-gate"><div className="student-gate-card">Loading your student portal…</div></main>;

  if (!demoMode && (!user || !profile)) {
    return (
      <main className="student-gate">
        <div className="student-gate-card">
          <Link href="/" className="student-brand"><BrandMark /> CampusFix</Link>
          <div className="student-gate-icon"><ShieldCheck size={23} /></div>
          <span className="student-eyebrow">STUDENT PORTAL</span>
          <h1>Campus care, with follow-through.</h1>
          <p>Sign in with your Google account to submit a campus report and track updates from your university team.</p>
          {authError && <div className="student-inline-error">{authError}</div>}
          <Link href="/login?portal=student" className="student-primary-link">Continue to student sign in <ArrowRight size={16} /></Link>
          <Link href="/" className="student-back-link"><ArrowLeft size={14} /> Back to CampusFix</Link>
        </div>
      </main>
    );
  }

  if (!demoMode && profile?.role !== "student") {
    return <main className="student-gate"><div className="student-gate-card"><div className="student-gate-icon"><ShieldCheck size={23} /></div><h1>This is the student portal.</h1><p>Your account has administrator access.</p><Link href="/login?portal=admin" className="student-primary-link">Open admin sign in <ArrowRight size={16} /></Link></div></main>;
  }

  const activeProfile = visibleProfile!;

  return (
    <main className="student-app">
      <header className="student-topbar">
        <Link href="/" className="student-brand"><BrandMark /> CampusFix</Link>
        <nav aria-label="Student navigation"><a href="#my-reports">My reports</a><a href="#new-report" onClick={() => setShowForm(true)}>Report an issue</a></nav>
        <div className="student-user"><span className="student-avatar">{activeProfile.name.slice(0, 1).toUpperCase()}</span><span>{activeProfile.name}</span>{demoMode ? <Link href="/login?portal=student" aria-label="Exit demo"><LogOut size={16} /></Link> : <button onClick={() => void logOut()} aria-label="Sign out"><LogOut size={16} /></button>}</div>
      </header>
      <section className="student-welcome">
        <div><span className="student-eyebrow">STUDENT SPACE <i /> {demoMode ? "LOCAL DEMO" : "YOUR CAMPUS, HEARD"}</span><h1>Good to see you, {activeProfile.name.split(" ")[0]}.</h1><p>Report a campus problem and follow every update from the team working on it.</p></div>
        <button className="student-new-button" onClick={() => setShowForm((value) => !value)}><Plus size={17} /> New report</button>
      </section>
      <section className="student-stats" aria-label="Report summary">
        <article><span>ALL REPORTS</span><b>{visibleComplaints.length}</b><small>Submitted from your account</small></article>
        <article><span>IN PROGRESS</span><b>{openCount}</b><small>Awaiting resolution</small></article>
        <article><span>RESOLVED</span><b>{visibleComplaints.length - openCount}</b><small>Closed by campus teams</small></article>
      </section>
      {showForm && <section className="student-form-card" id="new-report"><div className="student-section-heading"><div><span className="student-eyebrow">NEW CAMPUS REPORT</span><h2>What needs attention?</h2></div><button className="student-close" onClick={() => setShowForm(false)} aria-label="Close report form">×</button></div><form onSubmit={submitReport} className="student-report-form"><label>Short title<input name="title" maxLength={160} placeholder="e.g. Wi-Fi is down in my hostel" required /></label><label>Category<select name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="student-description-field">Tell us more<textarea name="description" rows={4} maxLength={10000} placeholder="Where is the problem, and when did it start?" required /></label>{formError && <p className="student-inline-error">{formError}</p>}<button className="student-new-button" disabled={saving}>{saving ? "Submitting…" : "Submit report"} <ArrowRight size={15} /></button></form></section>}
      {success && <div className="student-success"><ShieldCheck size={17} />{success}</div>}
      <section className="student-reports" id="my-reports">
        <div className="student-section-heading"><div><span className="student-eyebrow">YOUR ACTIVITY</span><h2>My reports</h2></div><span className="student-live"><i /> LIVE UPDATES</span></div>
        {loadError && !demoMode ? <div className="student-inline-error">Could not load your reports: {loadError}</div> : visibleComplaints.length === 0 ? <div className="student-empty"><span><ClipboardList size={22} /></span><h3>No reports yet</h3><p>When you submit a campus issue, its status and updates will appear here.</p><button className="student-text-button" onClick={() => setShowForm(true)}>Create your first report <ArrowRight size={14} /></button></div> : <div className="student-report-list">{visibleComplaints.map((item) => <article className="student-report-item" key={item.id}><div className="student-report-icon"><ClipboardList size={18} /></div><div className="student-report-copy"><span>{item.category || "CAMPUS ISSUE"} · {item.id.slice(0, 7).toUpperCase()}</span><h3>{item.title}</h3><p>{item.description}</p></div><span className="student-status">{item.status}</span></article>)}</div>}
      </section>
      <footer className="student-footer"><Link href="/">CampusFix</Link><span>{demoMode ? "Local demo · sample data only" : "Campus care, with follow-through."}</span><span>{demoMode ? <Link href="/login?portal=student">Exit demo</Link> : `Signed in as ${activeProfile.email}`}</span></footer>
    </main>
  );
}

function BrandMark() {
  return <span className="brand-icon"><span /><span /><span /></span>;
}
