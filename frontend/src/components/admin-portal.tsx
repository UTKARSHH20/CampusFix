"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  CopyCheck,
  Cpu,
  Eye,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import { useCampusAuth } from "@/components/auth-provider";
import { fileToDataUrl } from "@/lib/firebase/storage";
import { ImageLightbox, ImageThumbnails } from "@/components/image-lightbox";
import { ImageUploader } from "@/components/image-uploader";

export type Complaint = {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  title: string;
  description: string;
  category?: string;
  status: string;
  department?: string;
  priority?: string;
  location?: string;
  locationDetails?: string;
  urgency?: string;
  imageUrls?: string[];
  assignedStaff?: string;
  resolution?: string;
  resolutionProofUrls?: string[];
  resolvedAt?: { toMillis?: () => number } | string;
  rating?: number;
  feedback?: string;
  createdAt?: { toMillis?: () => number } | string;
  updatedAt?: { toMillis?: () => number } | string;
};

const departments = [
  "Facilities",
  "IT Department",
  "Hostel Office",
  "Classroom Services",
  "Housekeeping",
  "Campus Security",
];
const statuses = ["Submitted", "Under Review", "In Progress", "Resolved", "Closed"];
const priorities = ["Low", "Medium", "High", "Urgent"];
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type TriageSuggestion = {
  category: string;
  department: string;
  priority: string;
  reason: string;
};
type AiTriage = TriageSuggestion & {
  safetyFlag: boolean;
  visualAssessment?: string;
  estimatedEffort?: string;
};
type DuplicateResult = {
  isDuplicate: boolean;
  duplicateOfId?: string | null;
  confidenceScore?: number;
  explanation: string;
};
type WeeklyAnalysis = {
  summary: string;
  recurringProblems: { label: string; count: number; evidence: string }[];
  priorityConcerns: string[];
  recommendedActions: string[];
  resolutionInsight: string;
};

function suggestTriage(complaint: Complaint): TriageSuggestion {
  const text = `${complaint.title} ${complaint.description}`.toLowerCase();
  const duration =
    /\b(two|three|four|several|multiple|\d+)\s+(day|days|week|weeks|hour|hours)\b|since\s+(yesterday|\w+day|\w+ evening)|repeatedly|keeps?\s+(happening|failing|cutting)/i.test(
      text
    );
  const emergency =
    /\b(fire|smoke|sparking|exposed wire|electric shock|gas leak|injury|injured|flooding|structural collapse)\b/i.test(
      text
    );
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
      : duration
      ? "The electrical issue is ongoing or recurring and may disrupt rooms or classes."
      : "Facilities is the likely team for this electrical repair.";
  } else if (/hostel|dorm|residence|roommate|warden/.test(text)) {
    category = "Hostel";
    department = "Hostel Office";
    reason =
      "The report concerns hostel living or accommodation, so the Hostel Office is the likely first contact.";
  } else if (/classroom|lecture hall|projector|blackboard|desk|class room/.test(text)) {
    category = "Classroom";
    department = "Classroom Services";
    reason = "The issue is reported in a teaching space, so Classroom Services is the likely team.";
  } else if (
    /clean|garbage|trash|waste|bin|litter|sanitation|dirty|overflowing/.test(text)
  ) {
    category = "Cleanliness";
    department = "Housekeeping";
    priority = duration ? "High" : "Low";
    reason = duration
      ? "The cleanliness issue appears unresolved over time and may need prompt housekeeping follow-up."
      : "This appears to be a cleaning or waste collection request for Housekeeping.";
  } else if (/security|theft|stolen|harass|threat|unsafe|suspicious/.test(text)) {
    category = "Campus Security";
    department = "Campus Security";
    priority = "High";
    reason =
      "The report mentions a safety or security concern and should be reviewed promptly by Campus Security.";
  } else if (/leak|plumb|water|pipe|drain|toilet|tap|flood/.test(text)) {
    category = "Plumbing / Water";
    department = "Facilities";
    priority = emergency ? "Urgent" : duration ? "High" : "Medium";
    reason = emergency
      ? "The report suggests active flooding or damage and may require immediate Facilities attention."
      : "Facilities is the likely team for a water or plumbing repair.";
  }

  if (emergency && priority !== "Urgent") {
    priority = "Urgent";
    reason = "A possible immediate safety risk was detected; have staff review it urgently.";
  }
  return { category, department, priority, reason };
}

const defaultAdmin = {
  name: "Campus Administrator",
  email: "admin@campusfix.local",
  role: "admin" as const,
};

export function AdminPortal() {
  const { profile, logOut, user, loading } = useCampusAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");

  const getAuthToken = async () => {
    if (user) {
      try {
        const token = await user.getIdToken();
        if (token) return token;
      } catch {
        // fallback
      }
    }
    return "dev-admin-session";
  };

  // Filters state
  const [searchFilter, setSearchFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Lightbox modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const refreshComplaints = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints`, {
        headers: { Authorization: "Bearer dev-admin" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.complaints)) {
          setComplaints(
            data.complaints.map((c: Record<string, unknown>) => ({
              id: (c.id || c._id) as string,
              ...c,
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Backend fetch failed:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/complaints`, {
          headers: { Authorization: "Bearer dev-admin" },
        });
        if (res.ok && !ignore) {
          const data = await res.json();
          if (Array.isArray(data.complaints)) {
            setComplaints(
              data.complaints.map((c: Record<string, unknown>) => ({
                id: (c.id || c._id) as string,
                ...c,
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Backend fetch failed, using fallback:", err);
        setLoadError("Backend service unavailable. Please ensure backend is running.");
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const activeProfile = profile || {
    name: user?.displayName || defaultAdmin.name,
    email: user?.email || defaultAdmin.email,
    photoURL: user?.photoURL || "",
    role: "admin" as const,
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (deptFilter && (item.department || "Unassigned") !== deptFilter) return false;
      if (priorityFilter && (item.priority || "Medium") !== priorityFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;

      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.locationDetails?.toLowerCase().includes(q) ||
        item.assignedStaff?.toLowerCase().includes(q) ||
        item.id?.toLowerCase().includes(q)
      );
    });
  }, [complaints, deptFilter, priorityFilter, statusFilter, searchFilter]);

  const openCount = useMemo(
    () => complaints.filter((item) => !["Resolved", "Closed"].includes(item.status)).length,
    [complaints]
  );
  const urgentCount = useMemo(
    () =>
      complaints.filter((item) => ["High", "Urgent"].includes(item.priority || "")).length,
    [complaints]
  );

  const openLightbox = (images: string[], index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  async function generateWeeklyAnalysis() {
    setWeeklyLoading(true);
    setWeeklyError("");
    try {
      const recent = complaints.slice(0, 50);
      if (!recent.length)
        throw new Error("There are no reports to summarize yet.");

      const token = await getAuthToken();
      const response = await fetch("/api/ai/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "weekly",
          complaints: recent.map((item) => ({
            title: item.title,
            description: item.description,
            category: item.category,
            location: item.location,
            status: item.status,
            department: item.department,
            priority: item.priority,
            createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
          })),
        }),
      });
      const result = (await response.json()) as {
        analysis?: WeeklyAnalysis;
        error?: string;
      };
      if (!response.ok || !result.analysis)
        throw new Error(result.error || "Gemini could not create the weekly report.");
      setWeeklyAnalysis(result.analysis);
    } catch (cause) {
      setWeeklyError(
        cause instanceof Error ? cause.message : "Could not generate the weekly report."
      );
    } finally {
      setWeeklyLoading(false);
    }
  }

  const displayName = activeProfile.name;
  const displayEmail = activeProfile.email;

  if (loading) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <div className="admin-gate-icon"><ShieldCheck size={28} /></div>
          <h2>Verifying Admin session…</h2>
        </div>
      </main>
    );
  }

  if (!user && !profile) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <Link href="/" className="admin-brand"><BrandMark /> CampusFix</Link>
          <div className="admin-gate-icon"><ShieldCheck size={28} /></div>
          <span className="admin-eyebrow">CAMPUS OPERATIONS · SECURE ACCESS</span>
          <h1>Administrator Sign In</h1>
          <p>Sign in with your Google administrator account to access the dispatch dashboard and AI operations.</p>
          <Link href="/login?portal=admin" className="admin-primary-link">
            Sign In with Google Account <ArrowRight size={16} />
          </Link>
          <Link href="/" className="admin-back-link">Back to CampusFix</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-app">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <BrandMark /> CampusFix
        </Link>
        <span className="admin-sidebar-label">WORKSPACE</span>
        <a className="admin-nav-active" href="#queue">
          <ClipboardList size={16} /> Report queue <span>{complaints.length}</span>
        </a>
        <a href="#queue">
          <Building2 size={16} /> Department dispatch
        </a>
        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            {activeProfile.photoURL ? (
              <img
                src={activeProfile.photoURL}
                alt={displayName}
                className="admin-avatar"
                style={{ objectFit: "cover", width: "36px", height: "36px", borderRadius: "50%" }}
              />
            ) : (
              <span className="admin-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            )}
            <div>
              <b>{displayName}</b>
              <small>Campus Administrator</small>
            </div>
          </div>
          <button onClick={() => void logOut()}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">
              CAMPUS OPERATIONS <i /> REAL-TIME DATABASE
            </span>
            <h1>Dispatch dashboard</h1>
            <p>Review incoming reports, inspect evidence photos, dispatch staff, and record resolution proof.</p>
          </div>
          <span className="admin-live">
            <i /> CONNECTED
          </span>
        </header>

        {/* AI Briefing Panel */}
        <section className="admin-ai-panel">
          <div className="admin-ai-intro">
            <span className="admin-ai-icon">
              <Cpu size={16} />
            </span>
            <div>
              <span className="admin-eyebrow">GEMINI FLASH CAMPUS BRIEFING</span>
              <h2>Recurring issues &amp; weekly report</h2>
              <p>
                Find related complaints, emerging patterns, safety concerns, and recommended next steps from campus reports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void generateWeeklyAnalysis()}
              disabled={weeklyLoading}
            >
              {weeklyLoading ? "Analyzing…" : "Generate AI report"}
            </button>
          </div>
          {weeklyError && <div className="admin-error">{weeklyError}</div>}
          {weeklyAnalysis && (
            <div className="admin-ai-results">
              <p className="admin-ai-summary">{weeklyAnalysis.summary}</p>
              {weeklyAnalysis.recurringProblems.length > 0 && (
                <div>
                  <b>Recurring patterns</b>
                  <ul>
                    {weeklyAnalysis.recurringProblems.map((item, index) => (
                      <li key={`${item.label}-${index}`}>
                        <strong>{item.label}</strong> · {item.count} related{" "}
                        {item.count === 1 ? "report" : "reports"}
                        <small>{item.evidence}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weeklyAnalysis.priorityConcerns.length > 0 && (
                <div>
                  <b>Needs attention</b>
                  <ul>
                    {weeklyAnalysis.priorityConcerns.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {weeklyAnalysis.recommendedActions.length > 0 && (
                <div>
                  <b>Suggested next steps</b>
                  <ul>
                    {weeklyAnalysis.recommendedActions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="admin-ai-hint">{weeklyAnalysis.resolutionInsight}</p>
            </div>
          )}
        </section>

        {/* Metrics Grid */}
        <div className="admin-metrics">
          <article>
            <span>ALL REPORTS</span>
            <b>{complaints.length}</b>
            <small>Stored in database</small>
          </article>
          <article>
            <span>AWAITING RESOLUTION</span>
            <b>{openCount}</b>
            <small>Open reports</small>
          </article>
          <article>
            <span>HIGH / URGENT</span>
            <b>{urgentCount}</b>
            <small>Needs quick attention</small>
          </article>
        </div>

        {/* Queue Section */}
        <section className="admin-queue" id="queue">
          <div className="admin-queue-heading">
            <div>
              <span className="admin-eyebrow">INCOMING &amp; ACTIVE</span>
              <h2>Report queue</h2>
            </div>
            <span className="admin-queue-count">{filteredComplaints.length} SHOWN</span>
          </div>

          {/* Search & Multi-Filters */}
          <div className="admin-filters">
            <div className="admin-filter-search">
              <Search size={14} className="admin-filter-search-icon" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by title, location, technician, ID..."
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {loadError ? (
            <div className="admin-error">Could not load reports: {loadError}</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="admin-empty">
              <span>
                <ClipboardList size={22} />
              </span>
              <h3>No matching reports in the queue.</h3>
              <p>Adjust your search filters or check back later for new student submissions.</p>
            </div>
          ) : (
            <div className="admin-report-list">
              {filteredComplaints.map((complaint) => (
                <DispatchCard
                  key={complaint.id}
                  complaint={complaint}
                  allComplaints={complaints}
                  onOpenLightbox={openLightbox}
                  onSaved={() => {
                    void refreshComplaints();
                    setSavedMessage("Update saved permanently to database.");
                    window.setTimeout(() => setSavedMessage(""), 2600);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Lightbox for zooming photos */}
        <ImageLightbox
          isOpen={isLightboxOpen}
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
        />

        {savedMessage && (
          <div className="admin-toast">
            <Check size={15} /> {savedMessage}
          </div>
        )}

        <footer className="admin-footer">
          <Link href="/">CampusFix</Link>
          <span>Campus care, with follow-through.</span>
          <span>{displayEmail}</span>
        </footer>
      </section>
    </main>
  );
}

function DispatchCard({
  complaint,
  allComplaints,
  onOpenLightbox,
  onSaved,
}: {
  complaint: Complaint;
  allComplaints: Complaint[];
  onOpenLightbox: (images: string[], index?: number) => void;
  onSaved: () => void;
}) {
  const [department, setDepartment] = useState(complaint.department || "");
  const [priority, setPriority] = useState(complaint.priority || "Medium");
  const [status, setStatus] = useState(complaint.status || "Submitted");
  const [assignedStaff, setAssignedStaff] = useState(complaint.assignedStaff || "");
  const [resolutionNote, setResolutionNote] = useState(complaint.resolution || "");
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<AiTriage | null>(null);

  // Duplicate check and resolution draft states
  const [duplicateResult, setDuplicateResult] = useState<DuplicateResult | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [draftingResolution, setDraftingResolution] = useState(false);

  const { user } = useCampusAuth();

  const getAuthToken = async () => {
    if (user) {
      try {
        const token = await user.getIdToken();
        if (token) return token;
      } catch {
        // fallback
      }
    }
    return "dev-admin-session";
  };

  const suggestion = useMemo(() => suggestTriage(complaint), [complaint]);

  async function analyzeWithGemini() {
    setAiLoading(true);
    setAiError("");
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/ai/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "triage",
          complaint: {
            title: complaint.title,
            description: complaint.description,
            category: complaint.category,
            location: complaint.location,
            locationDetails: complaint.locationDetails,
            urgency: complaint.urgency,
            imageUrls: complaint.imageUrls || [],
          },
        }),
      });
      const result = (await response.json()) as { analysis?: AiTriage; error?: string };
      if (!response.ok || !result.analysis)
        throw new Error(result.error || "Gemini could not analyze this report.");
      setAiSuggestion(result.analysis);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "Could not analyze this report.");
    } finally {
      setAiLoading(false);
    }
  }

  async function checkForDuplicates() {
    setCheckingDuplicates(true);
    try {
      const candidates = allComplaints.filter(
        (c) =>
          c.id !== complaint.id &&
          c.location === complaint.location &&
          !["Resolved", "Closed"].includes(c.status)
      );
      if (!candidates.length) {
        setDuplicateResult({
          isDuplicate: false,
          explanation: `No other active complaints found in ${complaint.location || "this building"}.`,
        });
        return;
      }

      const token = await getAuthToken();
      const response = await fetch("/api/ai/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "duplicate_check",
          complaint: {
            id: complaint.id,
            title: complaint.title,
            description: complaint.description,
            location: complaint.location,
            category: complaint.category,
          },
          complaints: candidates,
        }),
      });
      const result = (await response.json()) as { analysis?: DuplicateResult };
      if (result?.analysis) {
        setDuplicateResult(result.analysis);
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    } finally {
      setCheckingDuplicates(false);
    }
  }

  async function draftResolutionWithAI() {
    setDraftingResolution(true);
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/ai/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "resolution_draft",
          resolutionDraftInput: {
            title: complaint.title,
            category: complaint.category,
            adminNotes: resolutionNote || "Repaired and tested",
          },
        }),
      });
      const result = (await response.json()) as {
        analysis?: { resolutionSummary?: string };
      };
      if (result?.analysis?.resolutionSummary) {
        setResolutionNote(result.analysis.resolutionSummary);
      }
    } catch (err) {
      console.error("Failed to draft resolution:", err);
    } finally {
      setDraftingResolution(false);
    }
  }

  async function saveDispatch(overrideStatus?: string) {
    const finalStatus = overrideStatus || status;
    setSaving(true);
    setError("");
    try {
      // Process proof photos if any
      const proofUrls: string[] = complaint.resolutionProofUrls ? [...complaint.resolutionProofUrls] : [];
      if (resolutionFiles.length > 0) {
        for (const file of resolutionFiles) {
          const url = await fileToDataUrl(file);
          proofUrls.push(url);
        }
      }

      if (finalStatus === "Resolved") {
        await fetch(`${BACKEND_URL}/api/complaints/${complaint.id}/resolve`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer dev-admin",
          },
          body: JSON.stringify({
            resolution: resolutionNote.trim(),
            resolutionProofUrls: proofUrls,
          }),
        });
      }

      const res = await fetch(`${BACKEND_URL}/api/complaints/${complaint.id}/dispatch`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-admin",
        },
        body: JSON.stringify({
          department: department || "Unassigned",
          priority,
          status: finalStatus,
          assignedStaff: assignedStaff || "",
        }),
      });

      if (!res.ok) throw new Error("Could not update dispatch in database.");

      if (overrideStatus) setStatus(overrideStatus);
      setResolutionFiles([]);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save dispatch changes.");
    } finally {
      setSaving(false);
    }
  }

  const shownSuggestion = aiSuggestion || suggestion;

  return (
    <article className="admin-report-card">
      <div className="admin-report-top">
        <div className="flex-1">
          <span className="admin-category">
            {complaint.category || "CAMPUS ISSUE"} <i /> {complaint.id.slice(0, 11).toUpperCase()}
          </span>
          <h3>{complaint.title || "Untitled campus report"}</h3>
          <p>{complaint.description}</p>

          {/* Location & Urgency Badges */}
          <div className="admin-tags-row">
            {complaint.location && (
              <span className="admin-tag location">
                <MapPin size={10} />
                {complaint.location}
                {complaint.locationDetails ? ` (${complaint.locationDetails})` : ""}
              </span>
            )}
            {complaint.urgency && (
              <span className={`admin-tag urgency-${complaint.urgency.toLowerCase()}`}>
                <AlertTriangle size={10} />
                {complaint.urgency} Urgency
              </span>
            )}
            {complaint.assignedStaff && (
              <span className="admin-tag">
                <UserCheck size={10} />
                Assigned: {complaint.assignedStaff}
              </span>
            )}
          </div>

          {/* Student Uploaded Images Gallery */}
          {complaint.imageUrls && complaint.imageUrls.length > 0 && (
            <div className="mt-2">
              <span className="text-[9px] text-slate-500 font-medium block">
                Evidence photos from student ({complaint.imageUrls.length}):
              </span>
              <ImageThumbnails
                images={complaint.imageUrls}
                onImageClick={(idx) => onOpenLightbox(complaint.imageUrls!, idx)}
              />
            </div>
          )}

          {/* Student Feedback (if already rated) */}
          {complaint.rating && (
            <div className="admin-student-rating-box">
              <div className="flex items-center gap-1 font-semibold">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span>Student gave {complaint.rating}/5 stars rating</span>
              </div>
              {complaint.feedback && <p className="mt-0.5 italic">“{complaint.feedback}”</p>}
            </div>
          )}
        </div>

        <span className={`admin-status ${status.toLowerCase().replaceAll(" ", "-")}`}>
          {status}
        </span>
      </div>

      {/* Quick Status Action Buttons */}
      <div className="admin-quick-actions">
        {status !== "In Progress" && (
          <button
            type="button"
            className="admin-quick-btn progress"
            onClick={() => void saveDispatch("In Progress")}
            disabled={saving}
          >
            Mark In Progress
          </button>
        )}
        {status !== "Resolved" && (
          <button
            type="button"
            className="admin-quick-btn resolve"
            onClick={() => void saveDispatch("Resolved")}
            disabled={saving}
          >
            Mark Resolved
          </button>
        )}
        <button
          type="button"
          className="admin-quick-btn"
          onClick={() => void checkForDuplicates()}
          disabled={checkingDuplicates}
          title="Detect related or duplicate reports in this location"
        >
          <CopyCheck size={11} /> {checkingDuplicates ? "Checking…" : "Check Duplicates"}
        </button>
      </div>

      {duplicateResult && (
        <div className={`admin-duplicate-box ${duplicateResult.isDuplicate ? "match" : ""}`}>
          <div className="flex items-center gap-1.5 font-semibold">
            {duplicateResult.isDuplicate ? <AlertTriangle size={12} /> : <Check size={12} />}
            <span>
              {duplicateResult.isDuplicate
                ? `Potential duplicate detected (${duplicateResult.confidenceScore}% confidence)`
                : "No duplicate issues"}
            </span>
          </div>
          <p className="mt-1 m-0">{duplicateResult.explanation}</p>
        </div>
      )}

      {/* AI / Quick Triage Recommendation */}
      <section className="admin-triage" aria-label="Triage suggestion">
        <div className="admin-triage-heading">
          <span className="admin-triage-spark">
            <Cpu size={13} />
          </span>
          <div>
            <b>{aiSuggestion ? "Gemini Flash recommendation" : "Quick triage suggestion"}</b>
            <small>
              {aiSuggestion
                ? "AI analyzed text & photos · admin approval required"
                : "Quick text matching · ask Gemini for multimodal analysis"}
            </small>
          </div>
          <button
            type="button"
            onClick={() => void analyzeWithGemini()}
            disabled={aiLoading}
          >
            {aiLoading ? "Analyzing…" : "Analyze with AI"}
          </button>
        </div>

        <div className="admin-triage-pills">
          <span>{shownSuggestion.category}</span>
          <span className={`priority-${shownSuggestion.priority.toLowerCase()}`}>
            {shownSuggestion.priority} priority
          </span>
          <span>{shownSuggestion.department}</span>
          {aiSuggestion?.safetyFlag && <span className="priority-urgent">Safety concern</span>}
          {aiSuggestion?.estimatedEffort && (
            <span className="font-semibold text-emerald-800">
              {aiSuggestion.estimatedEffort}
            </span>
          )}
        </div>
        <p>{shownSuggestion.reason}</p>

        {aiSuggestion?.visualAssessment && aiSuggestion.visualAssessment !== "No photos attached." && (
          <div className="admin-ai-vision-box">
            <b>
              <Eye size={12} /> Gemini Vision Inspection
            </b>
            <p>{aiSuggestion.visualAssessment}</p>
          </div>
        )}

        <button
          type="button"
          className="admin-ai-apply"
          onClick={() => {
            setDepartment(shownSuggestion.department);
            setPriority(shownSuggestion.priority);
          }}
        >
          Apply recommendation
        </button>
        {aiError && <div className="admin-error">{aiError}</div>}
      </section>

      {/* Dispatch Controls */}
      <div className="admin-dispatch-controls">
        <label>
          Department
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option value="">Unassigned</option>
            {departments.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            {priorities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <div className="admin-assigned-staff-field">
          Assigned Staff / Tech
          <input
            value={assignedStaff}
            onChange={(e) => setAssignedStaff(e.target.value)}
            placeholder="e.g. Ramesh (Electrician)"
          />
        </div>

        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <button onClick={() => void saveDispatch()} disabled={saving}>
          {saving ? "Saving…" : "Save update"}
        </button>
      </div>

      {/* Resolution Proof & Notes Section */}
      <div className="admin-resolution-form">
        <div className="flex items-center justify-between mb-1.5">
          <b>Resolution Notes &amp; Completion Proof (Visible to Student)</b>
          <button
            type="button"
            className="admin-ai-draft-btn"
            onClick={() => void draftResolutionWithAI()}
            disabled={draftingResolution || saving}
            title="Auto-draft a student-facing repair explanation with AI"
          >
            <Cpu size={11} />
            {draftingResolution ? "Drafting…" : "Draft Note with AI"}
          </button>
        </div>
        <textarea
          rows={2}
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          placeholder="Describe how the problem was resolved (e.g. Replaced faulty circuit breaker and tested voltage)..."
        />

        {/* Existing Proof Images */}
        {complaint.resolutionProofUrls && complaint.resolutionProofUrls.length > 0 && (
          <div className="mt-2 mb-2">
            <span className="text-[9px] text-slate-500 font-medium block">
              Uploaded proof photos:
            </span>
            <ImageThumbnails
              images={complaint.resolutionProofUrls}
              onImageClick={(idx) => onOpenLightbox(complaint.resolutionProofUrls!, idx)}
            />
          </div>
        )}

        {/* Upload new resolution proof photo */}
        <div className="mt-2">
          <ImageUploader
            maxImages={2}
            selectedFiles={resolutionFiles}
            onFilesSelected={(files) =>
              setResolutionFiles((prev) => [...prev, ...files])
            }
            onRemoveFile={(idx) =>
              setResolutionFiles((prev) => prev.filter((_, i) => i !== idx))
            }
            label="Attach completion proof photo (optional)"
            hint="Upload photo showing the resolved issue"
          />
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
    </article>
  );
}

function BrandMark() {
  return (
    <span className="brand-icon">
      <span />
      <span />
      <span />
    </span>
  );
}
