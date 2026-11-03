import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPortal } from "@/components/admin-portal";
import "./admin.css";
import "./admin-demo.css";

export const metadata: Metadata = {
  title: "Admin portal · CampusFix",
  description: "Review and route campus reports.",
};

export default function AdminPage() {
  return <Suspense fallback={<main className="admin-gate"><div className="admin-gate-card">Loading admin portal…</div></main>}><AdminPortal /></Suspense>;
}
