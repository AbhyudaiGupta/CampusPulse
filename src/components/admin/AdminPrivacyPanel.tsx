"use client";

import { ShieldCheck, EyeOff, UserCheck, Lock, CheckCircle2, Server } from "lucide-react";

export function AdminPrivacyPanel() {
  const principles = [
    {
      title: "Anonymous aggregate counts",
      desc: "All sensor ingest adapters process numerical tallies without capturing individual student attributes.",
      icon: EyeOff,
      tag: "Zero PII",
    },
    {
      title: "No face recognition",
      desc: "Zero camera video frames or facial biometrics are stored, transmitted, or evaluated at any edge tier.",
      icon: ShieldCheck,
      tag: "Biometric Free",
    },
    {
      title: "No individual route tracking",
      desc: "System evaluates macro zone density differentials rather than tracking personal paths across campus.",
      icon: Lock,
      tag: "Aggregated Only",
    },
    {
      title: "Role-based operational controls",
      desc: "Simulation triggers and actuator policies strictly require verified administrator JWT claims.",
      icon: UserCheck,
      tag: "Server RBAC",
    },
    {
      title: "Fictional data in prototype",
      desc: "All demonstrations rely on synthetic counts to illustrate operational value safely and transparently.",
      icon: Server,
      tag: "Synthetic Demo",
    },
  ];

  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--color-border-subtle)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-cyan-700" />
          <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">
            Institutional Privacy &amp; Trust Governance
          </h2>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 size={12} /> Privacy by Architectural Design
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {principles.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="p-3 rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-[6px] bg-white border border-[var(--color-border-subtle)] flex items-center justify-center text-cyan-700">
                    <Icon size={14} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-[12px] font-bold text-[var(--color-text-primary)] mb-1 leading-snug">
                  {p.title}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
