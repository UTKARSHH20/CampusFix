"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { useCampusAuth } from "@/components/auth-provider";
import { fileToDataUrl } from "@/lib/firebase/storage";
import { ImageLightbox, ImageThumbnails } from "@/components/image-lightbox";
import { ImageUploader } from "@/components/image-uploader";

export type Complaint = {
  id: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location?: string;
  locationDetails?: string;
  urgency?: "Low" | "Medium" | "High" | "Urgent";
  imageUrls?: string[];
  department?: string;
  assignedStaff?: string;
  resolution?: string;
  resolutionProofUrls?: string[];
  resolvedAt?: { toMillis?: () => number } | string;
  rating?: number;
  feedback?: string;
  createdAt?: { toMillis?: () => number } | string;
  updatedAt?: { toMillis?: () => number } | string;
};

const categories = [
  "Electrical",
  "Network / Wi-Fi",
  "Hostel",
  "Classroom",
  "Cleanliness",
  "Plumbing / Water",
  "Campus Security",
  "Other",
];

const campusLocations = [
  "Hostel Block A",
  "Hostel Block B",
  "Hostel Block C",
  "Academic Complex / Lecture Halls",
  "Central Library",
  "Computer Science & IT Labs",
  "Student Cafeteria / Mess",
  "Sports Complex / Gym",
  "Health Center",
  "Administrative Block",
  "Other Campus Area",
];

const urgencyLevels = ["Low", "Medium", "High", "Urgent"] as const;

const defaultStudent = {
  uid: "student-1",
  name: "Aarav Sharma",
  email: "aarav@campusfix.local",
  role: "student" as const,
};

export function StudentPortal() {
  const { user, profile, loading, logOut } = useCampusAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // Attached files for new complaint
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");

  // Lightbox modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/complaints", {
          headers: { Authorization: "Bearer dev-student" },
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
    uid: user?.uid || defaultStudent.uid,
    name: user?.displayName || defaultStudent.name,
    email: user?.email || defaultStudent.email,
    photoURL: user?.photoURL || "",
    role: "student" as const,
  };

  // Filter complaints by tab and search
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Tab filter
      const isResolved = ["Resolved", "Closed"].includes(item.status);
      if (activeTab === "active" && isResolved) return false;
      if (activeTab === "resolved" && !isResolved) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.locationDetails?.toLowerCase().includes(q) ||
        item.id?.toLowerCase().includes(q)
      );
    });
  }, [complaints, activeTab, searchQuery]);

  const openCount = useMemo(
    () => complaints.filter((item) => !["Resolved", "Closed"].includes(item.status)).length,
    [complaints]
  );

  const openLightbox = (images: string[], index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const category = String(form.get("category") || "Other");
    const location = String(form.get("location") || "");
    const locationDetails = String(form.get("locationDetails") || "").trim();
    const urgency = (form.get("urgency") || "Medium") as Complaint["urgency"];

    if (!title || !description) {
      setFormError("Add a short title and describe what happened.");
      return;
    }

    setSaving(true);
    setFormError("");
    setSuccess("");

    try {
      setUploadProgress("Converting & attaching photos...");
      const photoUrls = await Promise.all(selectedPhotos.map((file) => fileToDataUrl(file)));

      setUploadProgress("Saving to backend database...");
      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-student",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          locationDetails,
          urgency,
          imageUrls: photoUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend could not save the complaint.");
      }

      const result = await response.json();
      if (result.complaint) {
        const savedItem: Complaint = {
          id: (result.complaint.id || result.complaint._id) as string,
          ...result.complaint,
        };
        setComplaints((prev) => [savedItem, ...prev]);
      }

      formElement.reset();
      setSelectedPhotos([]);
      setSuccess("Your report has been permanently saved to the database. Follow updates below.");
      setShowForm(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Your report could not be submitted.");
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  }

  async function handleRateResolution(complaintId: string, rating: number, feedback: string) {
    try {
      await fetch(`http://localhost:5000/api/complaints/${complaintId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-student",
        },
        body: JSON.stringify({ rating, feedback }),
      });
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, rating, feedback } : c))
      );
    } catch (err) {
      console.error("Failed to save resolution rating:", err);
    }
  }

  if (loading) {
    return (
      <main className="student-gate">
        <div className="student-gate-card">
          <div className="student-gate-icon"><ShieldCheck size={28} /></div>
          <h2>Verifying Google Session…</h2>
        </div>
      </main>
    );
  }

  if (!user && !profile) {
    return (
      <main className="student-gate">
        <div className="student-gate-card">
          <Link href="/" className="student-brand"><BrandMark /> CampusFix</Link>
          <div className="student-gate-icon"><ShieldCheck size={28} /></div>
          <span className="student-eyebrow">GOOGLE AUTHENTICATION REQUIRED</span>
          <h1>Sign in with Google</h1>
          <p>Please authenticate with your official Google account to file campus complaints and track updates.</p>
          <Link href="/login?portal=student" className="student-primary-link">
            Continue with Google Account <ArrowRight size={16} />
          </Link>
          <Link href="/" className="student-back-link"><ArrowLeft size={14} /> Back to CampusFix</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="student-app">
      <header className="student-topbar">
        <Link href="/" className="student-brand">
          <BrandMark /> CampusFix
        </Link>
        <nav aria-label="Student navigation">
          <a href="#my-reports">My reports</a>
          <a href="#new-report" onClick={() => setShowForm(true)}>
            Report an issue
          </a>
        </nav>
        <div className="student-user">
          {activeProfile.photoURL ? (
            <img
              src={activeProfile.photoURL}
              alt={activeProfile.name}
              className="student-avatar"
              style={{ objectFit: "cover", width: "32px", height: "32px", borderRadius: "50%" }}
            />
          ) : (
            <span className="student-avatar">{activeProfile.name.slice(0, 1).toUpperCase()}</span>
          )}
          <span>{activeProfile.name}</span>
          <button onClick={() => void logOut()} aria-label="Sign out" title="Sign out of Google">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <section className="student-welcome">
        <div>
          <span className="student-eyebrow">
            STUDENT SPACE <i /> REAL-TIME CONNECTED
          </span>
          <h1>Good to see you, {activeProfile.name.split(" ")[0]}.</h1>
          <p>
            Report campus issues with evidence photos, track live maintenance progress, and rate repairs upon completion.
          </p>
        </div>
        <button
          className="student-new-button"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus size={17} /> New report
        </button>
      </section>

      <section className="student-stats" aria-label="Report summary">
        <article>
          <span>ALL REPORTS</span>
          <b>{complaints.length}</b>
          <small>Stored in database</small>
        </article>
        <article>
          <span>IN PROGRESS</span>
          <b>{openCount}</b>
          <small>Awaiting resolution</small>
        </article>
        <article>
          <span>RESOLVED</span>
          <b>{complaints.length - openCount}</b>
          <small>Closed by campus teams</small>
        </article>
      </section>

      {showForm && (
        <section className="student-form-card" id="new-report">
          <div className="student-section-heading">
            <div>
              <span className="student-eyebrow">NEW CAMPUS REPORT</span>
              <h2>What needs attention?</h2>
            </div>
            <button
              className="student-close"
              onClick={() => setShowForm(false)}
              aria-label="Close report form"
            >
              ×
            </button>
          </div>

          <form onSubmit={submitReport} className="student-report-form">
            <label>
              Short title
              <input
                name="title"
                maxLength={160}
                placeholder="e.g. Wi-Fi router down in corridor or Water leak in washroom"
                required
              />
            </label>

            <label>
              Category
              <select name="category">
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Campus Building / Zone
              <select name="location">
                <option value="">Select campus location...</option>
                {campusLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Specific Room / Landmark
              <input
                name="locationDetails"
                maxLength={100}
                placeholder="e.g. Room 204, 2nd Floor West Wing"
              />
            </label>

            <label>
              Urgency Level
              <select name="urgency" defaultValue="Medium">
                {urgencyLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl} {lvl === "Urgent" ? "— Immediate hazard / outage" : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="student-description-field">
              <label>
                Tell us more
                <textarea
                  name="description"
                  rows={4}
                  maxLength={10000}
                  placeholder="Where is the problem, what is affected, and when did it start?"
                  required
                />
              </label>
            </div>

            {/* Photo Attachment Section */}
            <div className="student-description-field">
              <ImageUploader
                selectedFiles={selectedPhotos}
                onFilesSelected={(newFiles) =>
                  setSelectedPhotos((prev) => [...prev, ...newFiles])
                }
                onRemoveFile={(idx) =>
                  setSelectedPhotos((prev) => prev.filter((_, i) => i !== idx))
                }
                label="Attach photos of the issue (optional)"
                hint="Add up to 3 photos (JPG, PNG, WEBP, max 8MB each)"
              />
            </div>

            {formError && <p className="student-inline-error">{formError}</p>}
            {uploadProgress && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
                {uploadProgress}
              </p>
            )}

            <button className="student-new-button" disabled={saving}>
              {saving ? uploadProgress || "Submitting…" : "Submit report"}{" "}
              <ArrowRight size={15} />
            </button>
          </form>
        </section>
      )}

      {success && (
        <div className="student-success">
          <ShieldCheck size={17} />
          {success}
        </div>
      )}

      <section className="student-reports" id="my-reports">
        <div className="student-section-heading">
          <div>
            <span className="student-eyebrow">YOUR ACTIVITY</span>
            <h2>My reports</h2>
          </div>
          <span className="student-live">
            <i /> LIVE DATABASE
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div className="student-filter-row">
          <div className="student-search-box">
            <Search size={14} className="student-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, location, ID..."
            />
          </div>

          <div className="student-tabs">
            <button
              type="button"
              className={`student-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All ({complaints.length})
            </button>
            <button
              type="button"
              className={`student-tab ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active ({openCount})
            </button>
            <button
              type="button"
              className={`student-tab ${activeTab === "resolved" ? "active" : ""}`}
              onClick={() => setActiveTab("resolved")}
            >
              Resolved ({complaints.length - openCount})
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="student-inline-error">{loadError}</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="student-empty">
            <span>
              <ClipboardList size={22} />
            </span>
            <h3>No reports found</h3>
            <p>
              {searchQuery
                ? "No matching reports found for your search query."
                : "When you submit a campus issue, its live progress and photos will appear here."}
            </p>
            {!searchQuery && (
              <button className="student-text-button" onClick={() => setShowForm(true)}>
                Create your first report <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="student-report-list">
            {filteredComplaints.map((item) => (
              <ReportCard
                key={item.id}
                item={item}
                onOpenLightbox={openLightbox}
                onRateResolution={handleRateResolution}
              />
            ))}
          </div>
        )}
      </section>

      {/* Image Lightbox Modal */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
      />

      <footer className="student-footer">
        <Link href="/">CampusFix</Link>
        <span>Campus care, with follow-through.</span>
        <span>Signed in as {activeProfile.email}</span>
      </footer>
    </main>
  );
}

function ReportCard({
  item,
  onOpenLightbox,
  onRateResolution,
}: {
  item: Complaint;
  onOpenLightbox: (images: string[], index?: number) => void;
  onRateResolution: (complaintId: string, rating: number, feedback: string) => Promise<void>;
}) {
  const [userRating, setUserRating] = useState<number>(item.rating || 0);
  const [feedbackText, setFeedbackText] = useState<string>(item.feedback || "");
  const [ratingSaved, setRatingSaved] = useState<boolean>(Boolean(item.rating));
  const [savingRating, setSavingRating] = useState<boolean>(false);

  const urgencyClass = (item.urgency || "medium").toLowerCase();

  // Status index for progress stepper
  const steps = ["Submitted", "Under Review", "In Progress", "Resolved"];
  const currentStepIndex = steps.indexOf(item.status);
  const isResolvedOrClosed = ["Resolved", "Closed"].includes(item.status);

  const handleRatingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userRating) return;
    setSavingRating(true);
    await onRateResolution(item.id, userRating, feedbackText);
    setSavingRating(false);
    setRatingSaved(true);
  };

  return (
    <article className="student-report-item flex-col items-stretch">
      <div className="flex items-start gap-3 w-full">
        <div className="student-report-icon">
          <ClipboardList size={18} />
        </div>
        <div className="student-report-copy">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate-500">
              {item.category || "CAMPUS ISSUE"} · {item.id.slice(0, 11).toUpperCase()}
            </span>
            <span className="student-status">{item.status}</span>
          </div>

          <h3>{item.title}</h3>
          <p>{item.description}</p>

          {/* Badges for location, urgency & department */}
          <div className="student-badges">
            {item.location && (
              <span className="student-badge location">
                <MapPin size={10} />
                {item.location}
                {item.locationDetails ? ` (${item.locationDetails})` : ""}
              </span>
            )}
            {item.urgency && (
              <span className={`student-badge ${urgencyClass}`}>
                <AlertTriangle size={10} />
                {item.urgency} Urgency
              </span>
            )}
            {item.department && (
              <span className="student-badge">
                <Wrench size={10} />
                {item.department}
                {item.assignedStaff ? ` · ${item.assignedStaff}` : ""}
              </span>
            )}
          </div>

          {/* Submitted complaint images */}
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-slate-500 font-medium block">
                Attached photos ({item.imageUrls.length}):
              </span>
              <ImageThumbnails
                images={item.imageUrls}
                onImageClick={(idx) => onOpenLightbox(item.imageUrls!, idx)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Visual Lifecycle Stepper */}
      <div className="student-timeline w-full">
        <div className="student-stepper">
          {steps.map((step, idx) => {
            const isCompleted = isResolvedOrClosed
              ? true
              : currentStepIndex >= 0 && idx < currentStepIndex;
            const isActive = isResolvedOrClosed
              ? step === "Resolved"
              : currentStepIndex === idx;

            return (
              <div
                key={step}
                className={`student-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
              >
                <div className="student-step-node">
                  {isCompleted && !isActive ? <CheckCircle2 size={12} /> : idx + 1}
                </div>
                <span className="student-step-label">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolution Details & Feedback section (Shown when ticket is resolved) */}
      {isResolvedOrClosed && (
        <div className="student-resolution-card w-full">
          <div className="student-resolution-title">
            <CheckCircle2 size={14} /> Resolution Details from Campus Administration
          </div>
          <p className="student-resolution-text">
            {item.resolution || "The campus maintenance team has marked this issue as resolved."}
          </p>

          {/* Resolution proof images uploaded by admin */}
          {item.resolutionProofUrls && item.resolutionProofUrls.length > 0 && (
            <div className="mt-1 mb-2">
              <span className="text-[9px] text-emerald-800 font-medium block">
                Proof of completion:
              </span>
              <ImageThumbnails
                images={item.resolutionProofUrls}
                onImageClick={(idx) => onOpenLightbox(item.resolutionProofUrls!, idx)}
              />
            </div>
          )}

          {/* Student Satisfaction Rating */}
          {ratingSaved ? (
            <div className="student-rated-badge">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>You rated this resolution: {userRating}/5 stars</span>
              {feedbackText && <small className="text-slate-600 italic">“{feedbackText}”</small>}
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="student-rating-form">
              <span className="text-[9px] text-slate-700 font-medium">Rate fix:</span>
              <div className="student-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    onClick={() => setUserRating(star)}
                    className={`student-star ${star <= userRating ? "filled fill-amber-500 text-amber-500" : ""}`}
                  />
                ))}
              </div>
              <input
                className="student-feedback-input"
                placeholder="Optional feedback (e.g. Fixed properly!)"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <button
                type="submit"
                className="student-feedback-button"
                disabled={!userRating || savingRating}
              >
                {savingRating ? "Saving..." : "Submit feedback"}
              </button>
            </form>
          )}
        </div>
      )}
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
