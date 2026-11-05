import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CircleHelp,
  ClipboardCheck,
  Cpu,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { CampusIllustration } from "@/components/campus-illustrations";

export default function Home() {
  return (
    <main className="site-frame">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="CampusFix home">
          <span className="brand-icon"><span /><span /><span /></span>
          <span>Campus<span className="brand-pulse">Fix</span><i>.</i></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#portals">Portals</a>
          <Link href="/student">Student Portal</Link>
          <Link href="/admin">Admin Dashboard</Link>
        </nav>
        <Link className="header-cta" href="/login">Sign in with Google <ArrowUpRight size={15} /></Link>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> KIIT UNIVERSITY <span className="eyebrow-line" /> CAMPUS CARE</div>
          <h1>Campus issues, <em>fixed together.</em></h1>
          <p className="hero-description">One clear place to report campus problems, follow every update, and make sure the right team sees the work through.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/login?portal=student">Report an issue <ArrowRight size={16} /></Link>
            <a className="quiet-link" href="#how-it-works">See how it works <ArrowDownRight size={15} /></a>
          </div>
          <div className="trust-note"><ShieldCheck size={15} /><span>Clear ownership</span><span className="trust-divider">·</span><span>Visible progress</span><span className="trust-divider">·</span><span>Verified resolution</span></div>
        </div>

        <aside className="sample-panel sample-panel--illustrated" aria-label="How a campus report moves to resolution">
          <div className="sample-heading"><span className="sample-icon"><Cpu size={16} /></span><div><b>From report to resolution</b><small>A CLEARER CAMPUS FEEDBACK LOOP</small></div><span className="preview-tag">CAMPUSFIX</span></div>
          <CampusIllustration scene="report" className="hero-illustration" />
          <div className="sample-quote">“The Wi-Fi in my hostel has not been working for two days.”</div>
          <div className="triage-rule" />
          <div className="triage-label">WHAT HAPPENS NEXT</div>
          <div className="triage-row"><span className="triage-symbol wifi-symbol"><Wifi size={17} /></span><span className="triage-text"><b>Report is categorised</b><small>Network / Wi-Fi issue</small></span><span className="match-score">01</span></div>
          <div className="triage-row"><span className="triage-symbol team-symbol"><Building2 size={16} /></span><span className="triage-text"><b>Campus team is assigned</b><small>Clear ownership and updates</small></span><Check className="confirmed-icon" size={16} /></div>
          <div className="sample-foot"><span><Cpu size={13} /> Suggestions can assist triage</span><span>People approve the action</span></div>
        </aside>
      </section>

      <section className="portal-section" id="portals">
        <div className="section-heading"><div><div className="eyebrow muted-eyebrow">DEDICATED WORKSPACES</div><h2>One campus. Two connected teams.</h2></div><p>Simple tools for students to speak up and for campus teams to follow through.</p></div>
        <div className="portal-grid">
          <article className="portal-card student-card">
            <div className="portal-index"><span className="portal-badge">01 / STUDENT PORTAL</span></div>
            <CampusIllustration scene="report" className="portal-illustration" label="Illustration of a student filing a campus report" />
            <h3>Make the issue visible.</h3><p>Share what happened, add a photo and location, then follow the progress without chasing updates.</p>
            <ul><li><Check size={14} /> Submit detailed issue reports</li><li><Check size={14} /> Track technician assignment</li><li><Check size={14} /> Rate completed work with feedback</li></ul>
            <Link href="/login?portal=student" className="portal-link">Open student portal <ArrowRight size={15} /></Link>
          </article>
          <article className="portal-card admin-card">
            <div className="portal-index"><span className="portal-badge">02 / ADMIN PORTAL</span></div>
            <CampusIllustration scene="dashboard" className="portal-illustration" label="Illustration of an administrator reviewing campus issue patterns" />
            <h3>Turn reports into action.</h3><p>Review incoming work, assign the right team and spot repeated problems across campus.</p>
            <ul><li><Check size={14} /> Triage and assign response units</li><li><Check size={14} /> Track departmental workloads</li><li><Check size={14} /> Detect duplicate issue submissions</li></ul>
            <Link href="/login?portal=admin" className="portal-link">Open admin portal <ArrowRight size={15} /></Link>
          </article>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro"><div className="eyebrow muted-eyebrow">OPERATIONAL LIFECYCLE</div><h2>From “something is broken” to “all fixed”.</h2><p>Every report gets a path, an owner and a clear outcome.</p><CampusIllustration scene="resolved" className="how-illustration" /><Link href="/student" className="quiet-link">Access student portal <ArrowRight size={15} /></Link></div>
        <div className="steps-list">
          <div className="step"><span>01</span><div><b>Report the issue</b><p>Add the details, location and a photo so the team knows what needs attention.</p></div><span className="step-mark">↗</span></div>
          <div className="step"><span>02</span><div><b>Review and assign</b><p>The report is reviewed, prioritised and routed to the right campus team.</p></div><span className="step-mark">↗</span></div>
          <div className="step"><span>03</span><div><b>Repair and verify</b><p>Work is recorded, proof is shared and the student can confirm the resolution.</p></div><span className="step-mark">✓</span></div>
        </div>
      </section>

      <footer className="site-footer"><Link className="brand footer-brand" href="/"><span className="brand-icon"><span /><span /><span /></span><span>Campus<span className="brand-pulse">Fix</span><i>.</i></span></Link><span>Campus care, with follow-through.</span><Link href="/student"><CircleHelp size={14} /> Student support</Link></footer>
    </main>
  );
}
