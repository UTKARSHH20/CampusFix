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
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CampusUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async () => {
    const currentUser = getFirebaseClient().auth.currentUser;
    if (!currentUser) {
      setProfile(null);
      return null;
    }
    const snapshot = await getDoc(doc(getFirebaseClient().db, "users", currentUser.uid));
    if (!snapshot.exists()) {
      setProfile(null);
      return null;
    }
    const data = snapshot.data();
    if (data.role !== "student" && data.role !== "admin") {
      setProfile(null);
      return null;
    }
    const next: CampusUser = {
      uid: currentUser.uid,
      name: String(data.name || currentUser.displayName || "Student"),
      email: String(data.email || currentUser.email || ""),
      photoURL: String(data.photoURL || currentUser.photoURL || ""),
      role: data.role,
      department: typeof data.department === "string" ? data.department : undefined,
    };
    setProfile(next);
    return next;
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const { auth } = getFirebaseClient();
      unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setError("");
        if (!nextUser) {
          setProfile(null);
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
          const session = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (!session.ok) throw new Error("CampusFix could not verify this sign-in session.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not load your campus profile.");
        } finally {
          setLoading(false);
        }
      });
      void startFirebaseAnalytics().catch(() => undefined);
    } catch (cause) {
      queueMicrotask(() => {
        setError(cause instanceof Error ? cause.message : "Firebase could not be initialized.");
        setLoading(false);
      });
    }
    return () => unsubscribe();
  }, [refreshProfile]);

  const logOut = useCallback(async () => {
    try {
      await fetch("/api/session", { method: "DELETE" });
      await signOut(getFirebaseClient().auth);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }, []);

  const value = useMemo(() => ({ user, profile, loading, error, refreshProfile, logOut }), [user, profile, loading, error, refreshProfile, logOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCampusAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useCampusAuth must be used inside AuthProvider.");
  return value;
}
