"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Plus, Search, CheckCircle2, AlertTriangle, Pause, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type Member = {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: "active" | "paused" | "past_due" | "cancelled" | "trial";
  source: string;
  joinedAt: string;
  nextRenewalAt: string | null;
  autoRenew: boolean;
  planId: number | null;
  planName: string | null;
  planType: string | null;
  lastVisitAt: string | null;
};

type Plan = {
  id: number;
  name: string;
  type: string;
  priceMonthlyCents: number | null;
  priceAnnualCents: number | null;
  active: boolean;
  activeMemberCount: number;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  trial: "bg-cyan-50 text-cyan-700",
  paused: "bg-amber-50 text-amber-700",
  past_due: "bg-red/10 text-red",
  cancelled: "bg-navy/10 text-navy/70",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}


export default function MembersPage() {
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [planFilter, setPlanFilter] = useState("");
  const [renewingSoon, setRenewingSoon] = useState(false);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  // Sort key matches the API's accepted values: lastName | joinedAt | nextRenewalAt | status.
  const [sortKey, setSortKey] = useState<"lastName" | "joinedAt" | "nextRenewalAt" | "status">("lastName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const abortRef = useRef<AbortController | null>(null);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("planId", planFilter);
      if (renewingSoon) params.set("renewingSoon", "true");
      if (debouncedQ.trim().length >= 2) params.set("q", debouncedQ.trim());
      params.set("sort", sortKey);
      params.set("dir", sortDir);
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/admin/members?${params}`, { signal: controller.signal }),
        fetch("/api/admin/membership-plans", { signal: controller.signal }),
      ]);
      if (mRes.ok) {
        const json = await mRes.json();
        setMembers(json.data || []);
        setTotal(json.total || 0);
      }
      if (pRes.ok) setPlans((await pRes.json()).data || []);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") throw e;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [statusFilter, planFilter, renewingSoon, debouncedQ, sortKey, sortDir]);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  useEffect(() => {
    const currentAbort = abortRef;
    return () => currentAbort.current?.abort();
  }, []);

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Members
          </h1>
          <p
            className="text-text-secondary text-sm mt-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {total} total · {members.filter((m) => m.status === "active").length} active
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/members/import"
            className="inline-flex items-center gap-1 bg-white border border-border text-navy rounded-md px-3 py-1.5 text-sm hover:bg-off-white"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90"
          >
            <Plus className="w-4 h-4" /> New Member
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2 mb-4 items-center" role="search">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            aria-label="Search members by name, email, or phone"
            className="w-full bg-off-white border border-border rounded-md pl-8 pr-3 py-1.5 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by member status"
          className="bg-off-white border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="paused">Paused</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          aria-label="Filter by membership plan"
          className="bg-off-white border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm text-navy">
          <input type="checkbox" checked={renewingSoon} onChange={(e) => setRenewingSoon(e.target.checked)} />
          Renewing this week
        </label>
        {(q || statusFilter !== "active" || planFilter || renewingSoon) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setStatusFilter("active");
              setPlanFilter("");
              setRenewingSoon(false);
            }}
            className="text-xs text-text-secondary hover:text-navy underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonRows count={8} />
      ) : members.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Users className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold mb-1">No members match</p>
          <p className="text-text-secondary text-sm">Try clearing filters, or add a new member.</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards — each row is a tap target that opens member detail */}
          <ul className="md:hidden space-y-2">
            {members.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/members/${m.id}`}
                  className="block bg-white border border-border rounded-xl p-3 hover:border-navy/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {m.email || m.phone || "—"}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium flex-shrink-0 ${STATUS_STYLES[m.status]}`}>
                      {m.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {m.status === "past_due" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {m.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary gap-2">
                    <span className="truncate">
                      {m.planName ? `${m.planName}` : "no plan"}
                    </span>
                    {m.nextRenewalAt && (
                      <span className="flex-shrink-0">
                        Renews {fmtDate(m.nextRenewalAt)}
                        {!m.autoRenew && " · manual"}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto bg-white border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
                <tr>
                  <SortableTh
                    label="Name"
                    sortKey="lastName"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <th className="px-4 py-3">Plan</th>
                  <SortableTh
                    label="Status"
                    sortKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortableTh
                    label="Joined"
                    sortKey="joinedAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <SortableTh
                    label="Next Renewal"
                    sortKey="nextRenewalAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                  />
                  <th className="px-4 py-3">Last Visit</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-off-white/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/members/${m.id}`} className="font-medium text-navy hover:text-red">
                        {m.firstName} {m.lastName}
                      </Link>
                      <div className="text-xs text-text-secondary">{m.email || m.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {m.planName ? (
                        <>
                          <div className="text-navy">{m.planName}</div>
                          <div className="text-xs text-text-secondary">{m.planType}</div>
                        </>
                      ) : (
                        <span className="text-text-secondary italic text-xs">no plan</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status]}`}>
                        {m.status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {m.status === "past_due" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {m.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
                        {m.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{fmtDate(m.joinedAt)}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {m.nextRenewalAt ? fmtDate(m.nextRenewalAt) : "—"}
                      {!m.autoRenew && m.nextRenewalAt && (
                        <div className="text-[10px] text-amber-600">manual</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{fmtDate(m.lastVisitAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(m)}
                        className="text-xs text-navy hover:text-red"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(showCreate || editing) && (
        <MemberModal
          member={editing}
          plans={plans}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={() => { setShowCreate(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

type SortKey = "lastName" | "joinedAt" | "nextRenewalAt" | "status";

function SortableTh({
  label, sortKey, activeKey, dir, onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onClick: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th className="px-4 py-3" aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className="inline-flex items-center gap-1 uppercase tracking-wide text-xs text-text-secondary hover:text-navy"
      >
        <span>{label}</span>
        {isActive ? (
          dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3 opacity-25" />
        )}
      </button>
    </th>
  );
}

function MemberModal({
  member, plans, onClose, onSaved,
}: {
  member: Member | null;
  plans: Plan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!member;
  const [form, setForm] = useState({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    membershipPlanId: member?.planId ? String(member.planId) : "",
    status: member?.status ?? ("active" as const),
    source: member?.source ?? "walk_in",
    joinedAt: member?.joinedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    nextRenewalAt: member?.nextRenewalAt?.slice(0, 10) ?? "",
    autoRenew: member?.autoRenew ?? true,
    pausedUntil: "", // only shown when status=paused
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        membershipPlanId: form.membershipPlanId ? Number(form.membershipPlanId) : null,
        status: form.status,
        source: form.source,
        joinedAt: new Date(form.joinedAt + "T00:00:00").toISOString(),
        nextRenewalAt: form.nextRenewalAt ? new Date(form.nextRenewalAt + "T00:00:00").toISOString() : null,
        autoRenew: form.autoRenew,
        pausedUntil:
          form.status === "paused" && form.pausedUntil
            ? new Date(form.pausedUntil + "T00:00:00").toISOString()
            : null,
        notes: form.notes || null,
      };
      const res = isEdit
        ? await fetch("/api/admin/members", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: member!.id, ...body }),
          })
        : await fetch("/api/admin/members", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.errors ? Object.entries(j.errors).map(([k, v]) => `${k}: ${v}`).join("; ") : j.error || "Save failed");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? "Edit Member" : "New Member"}</h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">First Name</span>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Last Name</span>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Plan</span>
              <select value={form.membershipPlanId} onChange={(e) => setForm({ ...form, membershipPlanId: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                <option value="">— No plan —</option>
                {plans.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Member["status"] })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="paused">Paused</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Source</span>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5">
                <option value="walk_in">Walk-in</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="tournament">Tournament</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Joined</span>
              <input type="date" value={form.joinedAt} onChange={(e) => setForm({ ...form, joinedAt: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="block text-xs text-text-secondary mb-1">Next Renewal</span>
              <input type="date" value={form.nextRenewalAt} onChange={(e) => setForm({ ...form, nextRenewalAt: e.target.value })} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
            </label>
            <label className="inline-flex items-center gap-2 col-span-2">
              <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />
              <span className="text-xs text-text-secondary">Auto-renew</span>
            </label>
            {form.status === "paused" && (
              <label className="block col-span-2">
                <span className="block text-xs text-text-secondary mb-1">
                  Pause until (auto-reactivates)
                </span>
                <input
                  type="date"
                  value={form.pausedUntil}
                  onChange={(e) => setForm({ ...form, pausedUntil: e.target.value })}
                  className="w-full bg-off-white border border-border rounded px-2 py-1.5"
                />
                <span className="block text-[10px] text-text-secondary mt-1">
                  Daily cron flips the member back to active on/after this date.
                </span>
              </label>
            )}
          </div>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full bg-off-white border border-border rounded px-2 py-1.5" />
          </label>
          {err && <div className="text-red text-xs">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-secondary hover:text-navy">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-navy text-white rounded-md text-sm hover:bg-navy/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
