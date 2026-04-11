"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Trash2,
  Shield,
  Users,
  Loader2,
  X,
} from "lucide-react";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  memberSince: string | null;
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red/20 text-red",
  staff: "bg-blue-500/20 text-blue-400",
  ref: "bg-amber-500/20 text-amber-400",
  front_desk: "bg-purple-500/20 text-purple-400",
  coach: "bg-emerald-500/20 text-emerald-400",
  parent: "bg-cyan-500/20 text-cyan-400",
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

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("");

  // Form state
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "coach" as string,
    phone: "",
    memberSince: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUserList(await res.json());
    } catch {
      // DB not set up yet
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
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    setEditingId(null);
    fetchUsers();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Users
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage coach, parent, and admin accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Add User
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-red" />
            Create New User
          </h2>
          {error && (
            <div className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder="Coach name"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder="coach@email.com"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder="Initial password"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all"
              >
                <option value="coach">Coach</option>
                <option value="parent">Parent</option>
                <option value="staff">Staff</option>
                <option value="ref">Referee</option>
                <option value="front_desk">Front Desk</option>
                <option value="admin">Admin (All Access)</option>
              </select>
              <p className="text-white/30 text-xs mt-1.5">
                {ROLE_DESCRIPTIONS[form.role]}
              </p>
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Member Since Year
              </label>
              <input
                type="number"
                min={2015}
                max={new Date().getFullYear()}
                value={form.memberSince}
                onChange={(e) => setForm({ ...form, memberSince: e.target.value })}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder={String(new Date().getFullYear())}
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Users className="w-4 h-4 text-red" />
          <h2 className="text-white font-bold text-sm uppercase tracking-wider">
            All Users
          </h2>
          <span className="text-text-secondary text-xs ml-auto">
            {userList.length} user{userList.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading users...
          </div>
        ) : userList.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Shield className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No users yet. Add your first coach or parent account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Role</th>
                  <th className="text-left px-6 py-3 font-semibold">Phone</th>
                  <th className="text-left px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{u.name}</span>
                      {u.memberSince && (
                        <span className="ml-2"><LoyaltyBadge memberSince={u.memberSince} /></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => {
                            handleRoleChange(u.id, e.target.value);
                          }}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="bg-navy border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-red cursor-pointer"
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
                          onClick={() => {
                            setEditingId(u.id);
                            setEditRole(u.role);
                          }}
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${ROLE_COLORS[u.role] || "bg-white/10 text-white/60"}`}
                          title="Click to change role"
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {u.phone || "—"}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="text-white/30 hover:text-red transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
