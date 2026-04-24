"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  UserPlus,
  Trash2,
  Shield,
  Users,
  Loader2,
  X,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { formatDate, formatPhone } from "@/lib/utils";

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  memberSince: string | null;
  approved: boolean | null;
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red/10 text-red",
  staff: "bg-blue-50 text-blue-600",
  ref: "bg-amber-50 text-amber-600",
  front_desk: "bg-purple-50 text-purple-600",
  coach: "bg-emerald-50 text-emerald-600",
  parent: "bg-cyan-50 text-cyan-600",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin (All Access)",
  staff: "Staff",
  ref: "Referee",
  front_desk: "Front Desk",
  coach: "Coach",
  parent: "Parent",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full access to all dashboards, settings, and data",
  staff: "Score entry, schedules, personal work history",
  ref: "Personal work history and referee checkout details",
  front_desk: "Scores, schedules, player check-ins, staffing",
  coach: "Team roster, check-in, waiver forms, schedule, scores",
  parent: "Waiver forms, schedule, scores (read-only)",
};

export default function UsersPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Derived: apply role + search filter. Memoized so we don't re-scan
  // userList on unrelated state changes (copied-email flash, confirmDelete
  // toggling, etc.) — previously this was an inline .filter in JSX.
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return userList.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (q) {
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [userList, roleFilter, searchQuery]);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  function handleCopyEmail(id: number, email: string) {
    navigator.clipboard.writeText(email).catch(() => {});
    setCopiedEmail(id);
    setTimeout(() => setCopiedEmail(null), 1500);
  }

  // Form state
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "coach" as string,
    phone: "",
    memberSince: "",
  });

  const [fetchError, setFetchError] = useState(false);

  const fetchUsers = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const body = await res.json();
        // API now returns { data, total } — legacy callers may still see an
        // array in dev; support both shapes so this migration is safe.
        setUserList(Array.isArray(body) ? body : body.data || []);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({ email: "", name: "", password: "", role: "coach", phone: "", memberSince: "" });
      setShowForm(false);
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create user");
    }
    setSaving(false);
  }

  async function handleRoleChange(id: number, newRole: string) {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update role");
    }
    setEditingId(null);
    fetchUsers();
  }

  async function handleApproval(id: number, approved: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || `Failed to ${approved ? "approve" : "deny"} user`);
    }
    fetchUsers();
  }

  function handleDelete(id: number, name: string) {
    setConfirmDelete({ id, name });
  }

  async function executeDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete user");
    }
    fetchUsers();
  }

  const pendingUsers = userList.filter((u) => u.approved === false);

  return (
    <>
    <ConfirmModal
      open={!!confirmDelete}
      title="Delete User"
      message={confirmDelete ? `Delete user "${confirmDelete.name}"? This cannot be undone.` : ""}
      confirmLabel="Delete"
      variant="danger"
      onConfirm={executeDelete}
      onCancel={() => setConfirmDelete(null)}
    />
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Users
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage coach, parent, and admin accounts
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" aria-hidden="true" /> Cancel
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" aria-hidden="true" /> Add User
            </>
          )}
        </button>
      </div>

      {/* Global error banner (visible even when form is closed) */}
      {!showForm && error && (
        <div className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-hover hover:text-navy ml-4" aria-label="Dismiss error">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl p-6 mb-8">
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-red" aria-hidden="true" />
            Create New User
          </h2>
          {error && (
            <div role="alert" aria-live="assertive" className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-name" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Name <span className="text-red">*</span>
              </label>
              <input
                id="user-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
                className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-gray-400"
                placeholder="Coach name"
              />
            </div>
            <div>
              <label htmlFor="user-email" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email <span className="text-red">*</span>
              </label>
              <input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-gray-400"
                placeholder="coach@email.com"
              />
            </div>
            <div>
              <label htmlFor="user-password" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password <span className="text-red">*</span>
              </label>
              <input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
                aria-describedby="user-password-hint"
                className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-gray-400"
                placeholder="Initial password"
              />
              <p id="user-password-hint" className="text-navy/50 text-xs mt-1">
                Min 8 characters. The user can change it after first sign-in.
              </p>
            </div>
            <div>
              <label htmlFor="user-role" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                id="user-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all"
              >
                <option value="coach">Coach</option>
                <option value="parent">Parent</option>
                <option value="staff">Staff</option>
                <option value="ref">Referee</option>
                <option value="front_desk">Front Desk</option>
                <option value="admin">Admin (All Access)</option>
              </select>
              <p className="text-navy/30 text-xs mt-1.5">
                {ROLE_DESCRIPTIONS[form.role]}
              </p>
            </div>
            <div>
              <label htmlFor="user-memberSince" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Member Since Year
              </label>
              <input
                id="user-memberSince"
                type="number"
                min={2015}
                max={new Date().getFullYear()}
                value={form.memberSince}
                onChange={(e) => setForm({ ...form, memberSince: e.target.value })}
                className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-gray-400"
                placeholder={String(new Date().getFullYear())}
              />
            </div>
            <div>
              <label htmlFor="user-phone" className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Phone (optional)
              </label>
              <input
                id="user-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
                className="w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-gray-400"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                )}
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search users"
            className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-gray-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="bg-white border border-border rounded-lg px-3 py-2.5 text-navy text-xs focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red cursor-pointer"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <h2 className="text-amber-700 font-bold text-sm uppercase tracking-wider">
              Pending Approval ({pendingUsers.length})
            </h2>
          </div>
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 bg-amber-50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-navy font-medium text-sm truncate">{u.name}</span>
                  <span className="text-navy/40 text-xs truncate hidden sm:inline">{u.email}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || "bg-off-white text-navy/60"}`}>
                    {u.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproval(u.id, true)}
                    className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id, u.name)}
                    className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-red" aria-hidden="true" />
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
            All Users
          </h2>
          <span className="text-text-secondary text-xs ml-auto">
            {userList.length} user{userList.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-navy/40">
            <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
            Loading users...
          </div>
        ) : fetchError ? (
          <div className="text-center py-16">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red/60" aria-hidden="true" />
            <p className="text-text-muted text-sm mb-3">Failed to load users</p>
            <button
              type="button"
              onClick={() => { setLoading(true); fetchUsers(); }}
              className="text-red hover:text-red-hover text-xs font-semibold uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        ) : userList.length === 0 ? (
          <div className="text-center py-16 text-navy/40">
            <Shield className="w-8 h-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm">No users yet. Add your first coach or parent account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">User accounts</caption>
              <thead>
                <tr className="border-b border-border text-navy/50 text-xs uppercase tracking-wider">
                  <th scope="col" className="text-left px-6 py-3 font-semibold">Name</th>
                  <th scope="col" className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Email</th>
                  <th scope="col" className="text-left px-6 py-3 font-semibold">Role</th>
                  <th scope="col" className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Status</th>
                  <th scope="col" className="text-left px-6 py-3 font-semibold hidden md:table-cell">Phone</th>
                  <th scope="col" className="text-left px-6 py-3 font-semibold hidden md:table-cell">Created</th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border hover:bg-off-white transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-navy font-medium">{u.name}</span>
                      {u.memberSince && (
                        <span className="ml-2"><LoyaltyBadge memberSince={u.memberSince} /></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 group">
                        <span className="truncate max-w-[180px]">{u.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(u.id, u.email)}
                          title="Copy email"
                          aria-label="Copy email address"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-navy/30 hover:text-red flex-shrink-0"
                        >
                          {copiedEmail === u.id ? (
                            <Check className="w-3 h-3 text-success" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                        </button>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <select
                          aria-label="Change user role"
                          value={editRole}
                          onChange={(e) => {
                            handleRoleChange(u.id, e.target.value);
                          }}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="bg-off-white border border-border rounded-lg px-2 py-1 text-navy text-xs focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red cursor-pointer"
                        >
                          <option value="coach">Coach</option>
                          <option value="parent">Parent</option>
                          <option value="staff">Staff</option>
                          <option value="ref">Referee</option>
                          <option value="front_desk">Front Desk</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(u.id);
                            setEditRole(u.role);
                          }}
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${ROLE_COLORS[u.role] || "bg-off-white text-navy/60"}`}
                          title="Click to change role"
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {u.approved === false ? (
                        <button
                          type="button"
                          onClick={() => handleApproval(u.id, true)}
                          className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Click to approve"
                        >
                          Pending
                        </button>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600/60">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary hidden md:table-cell">
                      {u.phone ? formatPhone(u.phone) : "—"}
                    </td>
                    <td className="px-6 py-4 text-text-secondary hidden md:table-cell">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/permissions/${u.id}`}
                          className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-navy/5 text-navy hover:bg-navy hover:text-white transition-colors"
                          title="Edit this user's per-page permissions"
                        >
                          Permissions
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.name)}
                          className="text-navy/30 hover:text-red transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
