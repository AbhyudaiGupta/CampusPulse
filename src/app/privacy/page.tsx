"use client";
import { Sidebar, TopNav } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/ui/Primitives";
import { Shield, Eye, Database, Lock, Users } from "lucide-react";

const PRINCIPLES = [
  {
    icon: <Eye size={20} />,
    title: "Anonymous aggregate only",
    body: "Occupancy data is collected as anonymous aggregate counts. No individual is identified, tracked, or profiled. No facial recognition, biometrics, MAC-address tracking, or CCTV analytics are used.",
  },
  {
    icon: <Shield size={20} />,
    title: "No personal location tracking",
    body: "CampusPulse does not collect, store, or process your physical location. Walk-time estimates are based on fixed building distances, not GPS or device data.",
  },
  {
    icon: <Database size={20} />,
    title: "Minimal data retention",
    body: "Only data necessary to deliver the service is stored. Occupancy snapshots are used only for forecasting and are not linked to individual users.",
  },
  {
    icon: <Lock size={20} />,
    title: "Secure access",
    body: "Authentication is handled by Supabase Auth. Your credentials are never stored in plaintext. Role-based access ensures students can only view their own data.",
  },
  {
    icon: <Users size={20} />,
    title: "Your data, your control",
    body: "You can delete your account and associated data at any time. Reservation data is only visible to the account that created it.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="app-layout">
      <div className="campus-grid-bg" aria-hidden />
      <Sidebar role="student" userName="Alex Sharma" />
      <main className="app-main" id="main-content">
        <TopNav title="Privacy" breadcrumb={["CampusPulse"]} notificationCount={2} userName="Alex Sharma" />
        <div className="page-content max-w-[760px]">
          <PageTransition>
            <div className="mb-8">
              <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight mb-2">Privacy Principles</h1>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
                CampusPulse is built privacy-first. Helping you navigate campus should never mean sacrificing your anonymity or personal data.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {PRINCIPLES.map((p, i) => (
                <div key={i} className="card flex gap-4">
                  <div className="w-10 h-10 rounded-[10px] bg-[var(--color-navy-800)] flex items-center justify-center text-[var(--color-cyan-400)] shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <h2 className="font-bold text-[15px] text-[var(--color-text-primary)] mb-1">{p.title}</h2>
                    <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card mt-6 bg-[var(--color-navy-900)] border-0">
              <p className="text-[13px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                This is a prototype application built for demonstration purposes. Occupancy data shown is a prototype simulation. No real sensor data, real-world tracking, or personal student information is processed in this demo.
              </p>
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
