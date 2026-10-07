"use client";

import { useState } from "react";
import {
  Lightbulb,
  AlertTriangle,
  Clock,
  Sparkles,
  Check,
  Send,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { OperationalInsight } from "@/lib/types";

interface AutomatedInsightsDeckProps {
  insights: OperationalInsight[];
  onApplyInsight: (insight: OperationalInsight) => Promise<void>;
  isApplyingId?: string | null;
}

export function AutomatedInsightsDeck({
  insights,
  onApplyInsight,
  isApplyingId = null,
}: AutomatedInsightsDeckProps) {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [confirmInsight, setConfirmInsight] = useState<OperationalInsight | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const executeApply = async (insight: OperationalInsight) => {
    setActionError(null);
    try {
      await onApplyInsight(insight);
      setAppliedIds((prev) => new Set(prev).add(insight.id));
      setConfirmInsight(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not prepare the advisory.");
    }
  };

  const handleApplyClick = (insight: OperationalInsight) => {
    if (insight.severity === "critical") {
      setConfirmInsight(insight);
    } else {
      executeApply(insight);
    }
  };

  return (
    <div className="card p-6 border border-[var(--color-border-subtle)] bg-white relative">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-border-subtle)] flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={16} className="text-amber-500" />
            <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-tight">
              Transparent Automated Insights
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[5px] bg-slate-100 text-slate-700 border border-slate-200">
              Deterministic Rules Engine
            </span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Algorithmic spatial optimization rules based on live capacity thresholds and queue telemetry.
          </p>
        </div>

        <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
          {insights.length} active signal{insights.length !== 1 ? "s" : ""} detected
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-[8px] text-[13px] text-[var(--color-text-muted)]">
          Campus load is currently within nominal thresholds. Trigger a scenario like <strong>Lunch Rush</strong> or <strong>Exam Week Surge</strong> to observe automated threshold insights.
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => {
            const isApplied = appliedIds.has(insight.id);
            const isApplying = isApplyingId === insight.id;

            const level =
              insight.severity === "critical"
                ? "Action needed"
                : insight.severity === "warning"
                ? "Monitor"
                : "Information";

            const badgeBg =
              level === "Action needed"
                ? "bg-red-50 text-red-800 border-red-200"
                : level === "Monitor"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-blue-50 text-blue-800 border-blue-200";

            return (
              <div
                key={insight.id}
                className="p-4 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Signal info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${badgeBg}`}>
                      Level: {level}
                    </span>
                    <span className="text-[12px] font-bold text-slate-700">
                      {insight.signal}
                    </span>
                    <span className="font-bold text-[14px] text-[var(--color-text-primary)]">
                      &bull; {insight.spaceName}
                    </span>
                  </div>

                  <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                    <strong className="text-[var(--color-text-primary)]">Rationale:</strong> {insight.rationale}
                  </p>

                  <p className="text-[12px] text-cyan-900 leading-relaxed bg-cyan-50/60 p-2 rounded-[6px] border border-cyan-100">
                    <strong className="text-cyan-950">Recommended Action:</strong> {insight.suggestedAction}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] pt-1">
                    <TrendingUp size={12} className="text-emerald-600" />
                    <span>Simulation estimate:</span>
                    <strong className="text-emerald-700">{insight.estimatedPrototypeEffect}</strong>
                  </div>
                </div>

                  {/* Right: Advisory action */}
                <div className="shrink-0 flex items-center md:flex-col md:items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyClick(insight)}
                    disabled={isApplied || isApplying}
                    className={`btn text-[12px] py-2 px-3.5 font-semibold flex items-center gap-1.5 rounded-[8px] ${
                      isApplied
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-[var(--color-navy-950)] hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check size={13} /> Advisory prepared
                      </>
                    ) : isApplying ? (
                      "Preparing..."
                    ) : (
                      <>
                        <Send size={13} /> Prepare Advisory
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {isApplied ? "Preview prepared or notice sent" : "Demo preview; configured backend can notify students"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {actionError && (
        <p role="alert" className="mt-4 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-[7px] px-3 py-2">
          {actionError}
        </p>
      )}

      {/* Confirmation Dialog for Major Actions */}
      {confirmInsight && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[6px] border border-[var(--color-border-subtle)] max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 id="confirm-action-title" className="text-[16px] font-bold text-[var(--color-text-primary)]">
                  Confirm Student Advisory
                </h3>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                  Prepare an advisory about {confirmInsight.spaceName}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[var(--color-surface-base)] rounded-[8px] border border-[var(--color-border-subtle)] text-[12px] space-y-1.5">
              <p className="font-semibold text-[var(--color-text-primary)]">
                {confirmInsight.suggestedAction}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {confirmInsight.rationale}
              </p>
              <div className="pt-1 text-[11px] text-cyan-800 font-medium">
                Simulation estimate: {confirmInsight.estimatedPrototypeEffect}
              </div>
            </div>

            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              This prepares a student advisory. It does not change live occupancy or facility settings.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setConfirmInsight(null)}
                className="btn btn-secondary text-[12px] py-1.5 px-3 rounded-[8px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeApply(confirmInsight)}
                className="btn btn-primary bg-red-600 hover:bg-red-700 text-white text-[12px] py-1.5 px-4 rounded-[8px] font-semibold"
              >
                Prepare Advisory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
