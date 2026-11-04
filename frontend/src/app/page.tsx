import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CircleHelp,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";

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
          <h1>Better campus<br />starts with <em>being heard.</em></h1>
          <p className="hero-description">Report the things that get in the way. CampusFix gets each issue to the right team and keeps you in the loop until it’s resolved.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/login?portal=student">Sign in to report <ArrowRight size={16} /></Link>
            <a className="quiet-link" href="#how-it-works">See how it works <ArrowDownRight size={15} /></a>
          </div>
          <div className="trust-note"><ShieldCheck size={15} /><span>Real-time connected campus maintenance system</span><span className="trust-divider">·</span><span>Instant dispatch &amp; AI triage</span></div>
        </div>

        <aside className="sample-panel" aria-label="Example AI triage">
          <div className="sample-heading"><span className="sample-icon"><Sparkles size={15} /></span><div><b>AI triage preview</b><small>EXAMPLE REPORT</small></div><span className="preview-tag">PREVIEW</span></div>
          <div className="sample-quote">“The Wi-Fi in my hostel has not been working for two days.”</div>
          <div className="triage-rule" />
          <div className="triage-label">SUGGESTED ROUTING</div>
          <div className="triage-row"><span className="triage-symbol wifi-symbol"><Wifi size={17} /></span><span className="triage-text"><b>Network / Wi-Fi</b><small>Predicted category</small></span><span className="match-score">High match</span></div>
          <div className="triage-row"><span className="triage-symbol urgency-symbol"><ArrowUpRight size={17} /></span><span className="triage-text"><b>High priority</b><small>Two-day interruption</small></span><span className="urgency-pill">HIGH</span></div>
          <div className="triage-row"><span className="triage-symbol team-symbol"><Building2 size={16} /></span><span className="triage-text"><b>IT Department</b><small>Recommended team</small></span><Check className="confirmed-icon" size={16} /></div>
          <div className="sample-foot"><span><Sparkles size={12} /> AI suggestion for review</span><span>Students stay in control</span></div>
        </aside>
        <div className="hero-index">01 <span>/</span> 03</div>
      </section>

      <section className="portal-section" id="portals">
        <div className="section-heading"><div><div className="eyebrow muted-eyebrow">ONE CAMPUS · TWO PURPOSE-BUILT SPACES</div><h2>Start where you belong.</h2></div><p>Student reports and university operations, with the right tools for each.</p></div>
        <div className="portal-grid">
          <article className="portal-card student-card"><div className="portal-index">01 <span>STUDENT PORTAL</span></div><div className="portal-icon"><ClipboardCheck size={19} /></div><h3>For students</h3><p>Submit a report, add photos, and see every update from the team working on it.</p><ul><li><Check size={14} /> Report campus problems</li><li><Check size={14} /> Follow progress and replies</li><li><Check size={14} /> Review AI suggestions before sending</li></ul><Link href="/login?portal=student" className="portal-link">Sign in as student <ArrowRight size={15} /></Link></article>
          <article className="portal-card admin-card"><div className="portal-index">02 <span>ADMIN PORTAL</span></div><div className="portal-icon admin-icon"><Building2 size={18} /></div><h3>For campus teams</h3><p>Review incoming reports, assign a department, and coordinate resolution across campus.</p><ul><li><Check size={14} /> Triage and route complaints</li><li><Check size={14} /> Track workload and resolution</li><li><Check size={14} /> Spot repeated campus issues</li></ul><Link href="/login?portal=admin" className="portal-link">Sign in as administrator <ArrowRight size={15} /></Link></article>
        </div>
      </section>

      <section className="how-section" id="how-it-works"><div className="how-intro"><div className="eyebrow muted-eyebrow">CLEAR FROM START TO FINISH</div><h2>A report should<br />never disappear.</h2><p>Every complaint has an owner, a status, and a visible path forward.</p><Link href="/student" className="quiet-link">Get started <ArrowRight size={15} /></Link></div><div className="steps-list"><div className="step"><span>01</span><div><b>Tell us what happened</b><p>Describe the issue, choose a location, and attach a photo if useful.</p></div><span className="step-mark">01</span></div><div className="step"><span>02</span><div><b>Review the AI suggestion</b><p>See the suggested category, priority, and department before submitting.</p></div><span className="step-mark">02</span></div><div className="step"><span>03</span><div><b>Follow progress</b><p>Get status updates and resolution notes in your student portal.</p></div><span className="step-mark">03</span></div></div></section>

      <footer className="site-footer"><Link className="brand footer-brand" href="/"><span className="brand-icon"><span /><span /><span /></span><span>Campus<span className="brand-pulse">Fix</span><i>.</i></span></Link><span>Campus care, with follow-through.</span><Link href="/student"><CircleHelp size={14} /> Student help</Link></footer>
    </main>
  );
}
