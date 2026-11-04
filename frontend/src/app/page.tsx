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
          <h1>Campus maintenance and incident resolution system</h1>
          <p className="hero-description">An integrated operations platform connecting students directly with university maintenance departments for fast, accountable repair dispatch and tracking.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/login?portal=student">Sign in to report <ArrowRight size={16} /></Link>
            <a className="quiet-link" href="#how-it-works">Review operations flow <ArrowDownRight size={15} /></a>
          </div>
          <div className="trust-note"><ShieldCheck size={15} /><span>Connected campus maintenance network</span><span className="trust-divider">·</span><span>Real-time dispatch and automated triage</span></div>
        </div>

        <aside className="sample-panel" aria-label="Example triage routing">
          <div className="sample-heading"><span className="sample-icon"><Cpu size={16} /></span><div><b>Automated triage and routing</b><small>INCIDENT DISPATCH PREVIEW</small></div><span className="preview-tag">SYSTEM PREVIEW</span></div>
          <div className="sample-quote">“The Wi-Fi in my hostel has not been working for two days.”</div>
          <div className="triage-rule" />
          <div className="triage-label">PREDICTED DISPATCH ROUTE</div>
          <div className="triage-row"><span className="triage-symbol wifi-symbol"><Wifi size={17} /></span><span className="triage-text"><b>Network / Wi-Fi</b><small>Classified issue category</small></span><span className="match-score">High match</span></div>
          <div className="triage-row"><span className="triage-symbol urgency-symbol"><ArrowUpRight size={17} /></span><span className="triage-text"><b>High priority</b><small>48-hour disruption detected</small></span><span className="urgency-pill">HIGH</span></div>
          <div className="triage-row"><span className="triage-symbol team-symbol"><Building2 size={16} /></span><span className="triage-text"><b>IT Department</b><small>Target response unit</small></span><Check className="confirmed-icon" size={16} /></div>
          <div className="sample-foot"><span><Cpu size={13} /> Machine intelligence classification</span><span>Operator-approved dispatch</span></div>
        </aside>
      </section>

      <section className="portal-section" id="portals">
        <div className="section-heading"><div><div className="eyebrow muted-eyebrow">DEDICATED WORKSPACES</div><h2>Targeted portals for students and staff</h2></div><p>Purpose-built interfaces for student submissions and administrative dispatch operations.</p></div>
        <div className="portal-grid">
          <article className="portal-card student-card"><div className="portal-index"><span className="portal-badge">STUDENT PORTAL</span></div><div className="portal-icon"><ClipboardCheck size={19} /></div><h3>For Students</h3><p>Submit incident reports with photographic evidence and track live repair progress from dispatch to completion.</p><ul><li><Check size={14} /> Submit detailed issue reports</li><li><Check size={14} /> Track technician assignment</li><li><Check size={14} /> Rate completed work with feedback</li></ul><Link href="/login?portal=student" className="portal-link">Sign in as student <ArrowRight size={15} /></Link></article>
          <article className="portal-card admin-card"><div className="portal-index"><span className="portal-badge">ADMIN PORTAL</span></div><div className="portal-icon admin-icon"><Building2 size={18} /></div><h3>For Campus Teams</h3><p>Manage incoming work queues, dispatch maintenance personnel, and identify recurring facility bottlenecks.</p><ul><li><Check size={14} /> Triage and assign response units</li><li><Check size={14} /> Track departmental workloads</li><li><Check size={14} /> Detect duplicate issue submissions</li></ul><Link href="/login?portal=admin" className="portal-link">Sign in as administrator <ArrowRight size={15} /></Link></article>
        </div>
      </section>

      <section className="how-section" id="how-it-works"><div className="how-intro"><div className="eyebrow muted-eyebrow">OPERATIONAL LIFECYCLE</div><h2>Structured incident resolution from start to finish</h2><p>Every logged incident follows an auditable lifecycle with assigned departmental ownership and timestamped resolution proof.</p><Link href="/student" className="quiet-link">Access portal <ArrowRight size={15} /></Link></div><div className="steps-list"><div className="step"><div><b>Issue Submission &amp; Photo Capture</b><p>Provide specific location details and attach clear photo evidence directly from your device.</p></div></div><div className="step"><div><b>Automated Triage &amp; Routing</b><p>System assesses urgency, identifies duplicate reports, and routes the ticket to Facilities, IT, or Housekeeping.</p></div></div><div className="step"><div><b>Dispatch &amp; Verified Completion</b><p>Assigned technician completes repair work, submits resolution documentation, and collects student verification.</p></div></div></div></section>

      <footer className="site-footer"><Link className="brand footer-brand" href="/"><span className="brand-icon"><span /><span /><span /></span><span>Campus<span className="brand-pulse">Fix</span><i>.</i></span></Link><span>Institutional maintenance management system</span><Link href="/student"><CircleHelp size={14} /> Student support</Link></footer>
    </main>
  );
}
