"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseClient, startFirebaseAnalytics } from "@/lib/firebase/client";

export type UserRole = "student" | "admin";
export type CampusUser = {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;
  department?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: CampusUser | null;
  loading: boolean;
  error: string;
  refreshProfile: () => Promise<CampusUser | null>;
  loginAsUser: (profile: CampusUser) => void;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "campusfix_google_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CampusUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load persisted session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CampusUser;
        if (parsed.uid && parsed.email && parsed.role) {
          setProfile(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const loginAsUser = useCallback((newProfile: CampusUser) => {
    setProfile(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch {
      // ignore
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const client = getFirebaseClient();
      const currentUser = client.auth.currentUser;
      if (!currentUser) {
        setProfile(null);
        return null;
      }

      let role: UserRole = "student";
      let department: string | undefined;

      try {
        const snapshot = await getDoc(doc(client.db, "users", currentUser.uid));
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.role === "student" || data.role === "admin") {
            role = data.role;
          }
          if (typeof data.department === "string") {
            department = data.department;
          }
        }
      } catch (err) {
        console.warn("Firestore user document lookup skipped:", err);
      }

      const bootstrapAdminUid = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_UID || "FnVGalePiRhNiXv55CpFDT8MG6I3";
      if (currentUser.uid === bootstrapAdminUid) {
        role = "admin";
      }

      const next: CampusUser = {
        uid: currentUser.uid,
        name: String(currentUser.displayName || "Google User"),
        email: String(currentUser.email || ""),
        photoURL: String(currentUser.photoURL || ""),
        role,
        department,
      };
      setProfile(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const { auth } = getFirebaseClient();
      unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setError("");
        if (!nextUser) {
          // If no Firebase user, check if local Google user exists
          setLoading(false);
          return;
        }
        try {
          const currentProfile = await refreshProfile();
          if (!currentProfile) {
            setLoading(false);
            return;
          }
          const idToken = await nextUser.getIdToken();
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }).catch(() => undefined);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not load your campus profile.");
        } finally {
          setLoading(false);
        }
      });
      void startFirebaseAnalytics().catch(() => undefined);
    } catch {
      // Firebase not configured, mark loading finished
      setLoading(false);
    }
    return () => unsubscribe();
  }, [refreshProfile]);

  const logOut = useCallback(async () => {
    try {
      await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
      try {
        await signOut(getFirebaseClient().auth);
      } catch {
        // Firebase not initialized
      }
    } finally {
      setUser(null);
      setProfile(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, error, refreshProfile, loginAsUser, logOut }),
    [user, profile, loading, error, refreshProfile, loginAsUser, logOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCampusAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useCampusAuth must be used inside AuthProvider.");
  return value;
}
