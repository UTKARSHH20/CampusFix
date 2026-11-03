import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPanel } from "@/components/login-panel";
import "../admin/admin-demo.css";

export const metadata: Metadata = {
  title: "Sign in · CampusFix",
  description: "Choose the CampusFix student or administrator portal.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-loading">Loading secure sign-in…</main>}>
      <LoginPanel />
    </Suspense>
  );
}
