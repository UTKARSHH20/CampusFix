import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentPortal } from "@/components/student-portal";
import "./student.css";

export const metadata: Metadata = {
  title: "Student portal · CampusFix",
  description: "Report campus issues and follow their progress.",
};

export default function StudentPage() {
  return <Suspense fallback={<main className="student-gate"><div className="student-gate-card">Loading student portal…</div></main>}><StudentPortal /></Suspense>;
}
