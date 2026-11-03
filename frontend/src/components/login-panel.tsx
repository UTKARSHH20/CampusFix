"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { useCampusAuth } from "@/components/auth-provider";

type Portal = "student" | "admin";
const bootstrapAdminUid = "FnVGalePiRhNiXv55CpFDT8MG6I3";

export function LoginPanel() {
  const searchParams = useSearchParams();
  const initialPortal: Portal = searchParams.get("portal") === "admin" ? "admin" : "student";
  const [portal, setPortal] = useState<Portal>(initialPortal);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { refreshProfile } = useCampusAuth();
  const isStudent = portal === "student";

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const { auth, db } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, "users", result.user.uid);
      const userSnapshot = await getDoc(userRef);
      let role: unknown;
      const isBootstrapAdmin = result.user.uid === bootstrapAdminUid;
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          name: result.user.displayName || "Student",
          email: result.user.email || "",
          photoURL: result.user.photoURL || "",
          role: isBootstrapAdmin ? "admin" : "student",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        role = "student";
      } else {
        role = userSnapshot.data()?.role;
        if (role === "student" && isBootstrapAdmin) {
          await updateDoc(userRef, { role: "admin", updatedAt: serverTimestamp() });
          role = "admin";
        }
      }
      if (role !== "student" && role !== "admin") {
        setNotice("Your campus profile has no valid role yet. Contact campus support.");
        return;
      }
      if (role !== portal) {
        setNotice(role === "admin"
          ? `This account (${result.user.email || result.user.uid}) has admin access. Choose the Admin portal to continue.`
          : `This account (${result.user.email || "Google account"}) is signed in as a student. To grant admin access, set role to the string admin on this exact Firestore document: users/${result.user.uid}`);
        return;
      }
      // The auth-state listener may have checked this profile before a new
      // student document was created; refresh now so the app context is current.
      await refreshProfile();
      const idToken = await result.user.getIdToken();
      const session = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!session.ok) throw new Error("Your sign-in could not be verified. Check that Firestore is enabled and try again.");
      router.replace(role === "admin" ? "/admin" : "/student");
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      const message = code === "auth/unauthorized-domain"
        ? "Add localhost to Firebase Authentication → Settings → Authorized domains."
        : code === "auth/operation-not-allowed"
          ? "Enable Google under Firebase Authentication → Sign-in method."
          : code === "auth/popup-closed-by-user"
            ? "Google sign-in was cancelled. You can try again."
            : code === "permission-denied"
              ? "Firestore denied profile access. Deploy the CampusFix Firestore rules, then try again."
              : cause instanceof Error
                ? cause.message
                : "Google sign-in could not start. Check your Firebase setup and try again.";
      setNotice(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-layout">
      <section className="login-brand-side">
        <Link className="brand brand-light" href="/" aria-label="CampusFix home">
          <span className="brand-icon"><span /><span /><span /></span>
          <span>Campus<span className="brand-pulse">Fix</span><i>.</i></span>
        </Link>
        <div className="login-brand-copy">
          <span className="login-overline">KIIT UNIVERSITY</span>
          <h1>Campus care<br />with <em>follow-through.</em></h1>
          <p>A shared place to report campus problems, understand what happens next, and keep every team accountable.</p>
        </div>
        <div className="privacy-promise"><ShieldCheck size={18} /><div><b>Your Google password stays with Google.</b><span>Sign-in uses Google’s secure authorization flow.</span></div></div>
        <span className="brand-side-index">CAMPUSFIX · STUDENT &amp; CAMPUS SERVICES</span>
      </section>
      <motion.section className="login-main-side" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
        <Link className="back-link" href="/"><ArrowLeft size={15} /> Back to CampusFix</Link>
        <div className="login-box">
          <div className="login-label">PORTAL ACCESS</div>
          <h2>Welcome back.</h2>
          <p className="login-subtitle">Choose the space you need to access.</p>
          <div className="portal-switch" role="tablist" aria-label="Choose a portal">
            <button className={isStudent ? "portal-choice active" : "portal-choice"} onClick={() => { setPortal("student"); setNotice(""); }} role="tab" aria-selected={isStudent}>
              <GraduationCap size={16} /> Student
            </button>
            <button className={!isStudent ? "portal-choice active" : "portal-choice"} onClick={() => { setPortal("admin"); setNotice(""); }} role="tab" aria-selected={!isStudent}>
              <Building2 size={16} /> Admin
            </button>
          </div>
          <div className="portal-context"><span className="context-mark">{isStudent ? <GraduationCap size={17} /> : <Building2 size={17} />}</span><div><b>{isStudent ? "Student portal" : "Administration portal"}</b><small>{isStudent ? "Submit and track your own campus reports." : "For authorized campus administrators only."}</small></div></div>
          <button className="google-sign-in" onClick={handleGoogleSignIn} disabled={busy}>
            <GoogleMark /> <span>{busy ? "Connecting to Google…" : "Continue with Google"}</span> <ArrowRight size={16} />
          </button>
          {process.env.NODE_ENV === "development" && <div className="portal-demo-links"><Link className="admin-demo-link" href={isStudent ? "/student?demo=1" : "/admin?demo=1"}>Open local {isStudent ? "student" : "admin"} demo without signing in</Link><Link className="portal-demo-other" href={isStudent ? "/admin?demo=1" : "/student?demo=1"}>Preview the {isStudent ? "admin" : "student"} portal</Link></div>}
          {notice && <div className="setup-notice" role="status"><span className="notice-dot" />{notice}</div>}
          <div className="login-separator"><span /> <small>SECURE UNIVERSITY ACCESS</small> <span /></div>
          <p className="role-note">{isStudent ? "Student accounts open the student dashboard. Administrators use the same Google sign-in and are checked against their assigned role." : "Admin access is restricted to trusted accounts. The verified project administrator can establish the initial admin profile."}</p>
          <div className="setup-card"><span className="setup-dot ready-dot" /><span><b>Firebase project connected</b><small>Google sign-in also requires Google Auth and Firestore enabled in Firebase Console.</small></span></div>
        </div>
        <div className="login-help">Having trouble? Contact your university IT help desk.</div>
      </motion.section>
    </main>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="google-mark"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.93c-.58 2.96-2.26 5.47-4.76 7.16l7.73 6C44.4 37.94 47 31.84 47 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.12.76-4.59l-7.98-6.19A23.89 23.89 0 0 0 0 24c0 3.9.94 7.59 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.82l-7.73-6c-2.14 1.45-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}
