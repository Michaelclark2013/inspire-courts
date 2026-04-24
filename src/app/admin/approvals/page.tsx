"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Clock , AlertTriangle } from "lucide-react";
import { cn, formatPhone } from "@/lib/utils";
import { triggerHaptic } from "@/lib/capacitor";

interface PendingUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  staff: "bg-blue-50 text-blue-600",
  ref: "bg-amber-50 text-amber-600",
  front_desk: "bg-purple-50 text-purple-600",
};

const ROLE_LABELS: Record<string, string> = {
  staff: "Staff",
  ref: "Referee",
  front_desk: "Front Desk",
};

export default function ApprovalsPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const fetchPending = useCallback(async (signal?: AbortSignal) => {
    setFetchError(false);
    try {
      const res = await fetch("/api/admin/approvals", { signal });
      if (signal?.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setPending(data.users || []);
      } else {
        setFetchError(true);
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setFetchError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPending(controller.signal);
    return () => controller.abort();
  }, [fetchPending]);

  async function handleAction(userId: number, action: "approve" | "reject") {
    triggerHaptic("medium");
    setActionLoading(userId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();

      if (res.ok) {
        triggerHaptic(action === "approve" ? "success" : "warning");
        setMessage(data.message);
        setPending((prev) => prev.filter((u) => u.id !== userId));
      } else {
        triggerHaptic("error");
        setMessage(data.error || "Action failed");
      }
    } catch {
      triggerHaptic("error");
      setMessage("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Phoenix",
    });
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Approvals
        </h1>
        <p className="text-text-secondary text-sm mt-1 hidden md:block">
          Approve or reject staff, referee, and front desk registrations
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div className="mb-4 bg-red/10 border border-red/20 rounded-xl px-4 py-3 text-red text-sm">
          {message}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-text-secondary animate-spin" aria-hidden="true" />
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="bg-white border border-light-gray rounded-xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red" aria-hidden="true" />
          </div>
          <p className="text-navy font-bold text-base mb-1">Failed to load approvals</p>
          <p className="text-text-secondary text-sm max-w-xs mx-auto mb-4">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => fetchPending()}
            className="text-sm font-semibold text-red hover:text-red/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && pending.length === 0 && (
        <div className="bg-white border border-light-gray rounded-xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" aria-hidden="true" />
          </div>
          <p className="text-navy font-bold text-base mb-1">All caught up</p>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            No pending approvals right now. New staff and referee registrations will appear here.
          </p>
        </div>
      )}

      {/* Pending users */}
      {!loading && !fetchError && pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">
            {pending.length} pending {pending.length === 1 ? "request" : "requests"}
          </p>

          {pending.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-light-gray rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-navy font-semibold text-sm truncate">
                    {user.name}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      ROLE_COLORS[user.role] || "bg-off-white text-navy/60"
                    )}
                  >
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
                <p className="text-text-secondary text-xs truncate">{user.email}</p>
                {user.phone && (
                  <p className="text-text-secondary text-xs">{formatPhone(user.phone)}</p>
                )}
                <div className="flex items-center gap-1 mt-1.5 text-text-secondary text-xs">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  Registered {formatDate(user.createdAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(user.id, "approve")}
                  disabled={actionLoading === user.id}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wide px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md hover:shadow-emerald-600/20"
                >
                  {actionLoading === user.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(user.id, "reject")}
                  disabled={actionLoading === user.id}
                  className="inline-flex items-center gap-1.5 bg-red/10 hover:bg-red/20 disabled:opacity-50 disabled:cursor-not-allowed text-red text-xs font-bold uppercase tracking-wide px-5 py-2.5 rounded-xl transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
