import Link from "next/link";
import { Activity } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-surface-base)] text-center px-6">
      <div className="w-14 h-14 rounded-[6px] bg-[var(--color-navy-800)] flex items-center justify-center mb-6">
        <Activity size={24} color="#22d3ee" />
      </div>
      <h1 className="text-[32px] font-black text-[var(--color-text-primary)] tracking-tight mb-2">404</h1>
      <p className="text-[17px] font-semibold text-[var(--color-text-primary)] mb-1">Page not found</p>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-8 max-w-[280px]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  );
}
