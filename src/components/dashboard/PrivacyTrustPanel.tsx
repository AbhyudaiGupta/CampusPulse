"use client";

import Link from "next/link";
import { Shield, EyeOff, UserCheck, ArrowRight, Lock } from "lucide-react";

export function PrivacyTrustPanel() {
  const commitments = [
    {
      title: "Anonymous aggregate occupancy only",
      desc: "Sensors report total headroom counts, never personal identities.",
    },
    {
      title: "No face recognition or biometric sensors",
      desc: "Thermal and optical doorway arrays operate with zero image storage.",
    },
    {
      title: "No individual route history",
      desc: "Device MAC addresses and Bluetooth beacons are never tracked.",
    },
  ];

  return (
    <div className="card p-5 bg-[var(--color-navy-950)] text-white border border-[var(--color-navy-700)] rounded-[6px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left header */}
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-[7px] bg-cyan-500/20 text-cyan-400">
              <Shield size={16} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Privacy by Design
            </span>
          </div>
          <h3 className="text-[16px] font-bold text-white tracking-tight">
            Transparent, zero-tracking smart campus intelligence
          </h3>
          <p className="text-[12px] text-slate-300 mt-1 leading-relaxed">
            CampusPulse operates under student privacy covenants: count crowds, protect individuals.
          </p>
        </div>

        {/* Center / Right commitments list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 md:max-w-2xl">
          {commitments.map((c) => (
            <div
              key={c.title}
              className="bg-[var(--color-navy-900)] border border-white/10 rounded-[5px] p-3"
            >
              <p className="text-[11px] font-bold text-cyan-200">{c.title}</p>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Right CTA */}
        <div className="shrink-0">
          <Link
            href="/privacy"
            className="btn btn-secondary text-[12px] py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 inline-flex items-center gap-1.5 font-medium"
          >
            Read privacy architecture
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
