"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { UserCircle, Save, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red", width: "33%" };
  if (score <= 3) return { label: "Medium", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setFetchError(false);
      const res = await fetch("/api/portal/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.isOAuth) setIsOAuthUser(true);
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
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/portal/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      }),
    });

    if (res.ok) {
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleteTyped !== "DELETE") return;
    if (!isOAuthUser && !deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/portal/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isOAuthUser ? {} : { password: deletePassword }),
      });

      if (res.ok) {
        signOut({ callbackUrl: "/login" });
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("Something went wrong. Check your connection.");
    }
    setDeleting(false);
  }

  const isEnvAdmin = session?.user?.id === "admin-env";
  const pwStrength = getPasswordStrength(newPassword);

  // Fetch error state
  if (fetchError && !loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">Profile</h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Profile</h3>
          <p className="text-text-muted text-sm mb-4">Could not load your profile. Check your connection and try again.</p>
          <button
            onClick={() => { setLoading(true); fetchProfile(); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4 transition-colors">
        <span aria-hidden="true">&larr;</span> Back to Dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Profile
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Manage your account settings
        </p>
      </div>

      {isEnvAdmin ? (
        <div className="bg-white border border-light-gray rounded-xl p-8 text-center">
          <UserCircle className="w-8 h-8 text-light-gray mx-auto mb-3" />
          <p className="text-navy font-semibold mb-1">Admin account</p>
          <p className="text-text-muted text-sm">
            This account is managed via environment variables.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile...
        </div>
      ) : (
        <>
        <div className="bg-white border border-light-gray rounded-xl p-6 max-w-lg mb-8">
          <div className="flex items-center gap-2 mb-6">
            <UserCircle className="w-4 h-4 text-red" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
              Account Details
            </h2>
          </div>

          {error && (
            <div role="alert" className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {saved && (
            <div role="status" aria-live="polite" className="bg-emerald-50 border border-emerald-500/30 text-emerald-600 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Profile updated successfully.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="profile-email" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-text-muted text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="profile-name" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                placeholder="(555) 123-4567"
              />
            </div>
            {/* Password change section */}
            <div className="border-t border-light-gray pt-5 mt-1">
              <p className="text-navy font-bold text-xs uppercase tracking-wider mb-4">Change Password</p>
            </div>
            <div>
              <label htmlFor="profile-currentpw" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                Current Password {newPassword && <span className="text-red">*</span>}
              </label>
              <input
                id="profile-currentpw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={!!newPassword}
                autoComplete="current-password"
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                placeholder="Required to change password"
              />
            </div>
            <div>
              <label htmlFor="profile-newpw" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                New Password (leave blank to keep current)
              </label>
              <input
                id="profile-newpw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-off-white border border-light-gray rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red"
                placeholder="New password"
                minLength={8}
              />
              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-navy/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                      style={{ width: pwStrength.width }}
                    />
                  </div>
                  <p className={`text-xs mt-1 font-medium ${
                    pwStrength.label === "Weak" ? "text-red" :
                    pwStrength.label === "Medium" ? "text-amber-600" :
                    "text-emerald-600"
                  }`}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </div>

        {/* Delete Account */}
        {!isEnvAdmin && (
          <div className="max-w-lg">
            <div className="bg-white border border-red/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-4 h-4 text-red" />
                <h2 className="text-red font-bold text-sm uppercase tracking-wider">
                  Delete Account
                </h2>
              </div>
              <p className="text-text-muted text-sm mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 bg-red/10 hover:bg-red/20 border border-red/30 text-red px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div className="bg-red/5 border border-red/20 rounded-lg p-4">
                    <p className="text-navy text-sm font-semibold mb-1">This will permanently:</p>
                    <ul className="text-text-muted text-xs space-y-1 list-disc list-inside">
                      <li>Delete your account and login credentials</li>
                      <li>Remove you as coach from any assigned teams</li>
                      <li>Unlink you from any player records</li>
                      <li>Sign you out immediately</li>
                    </ul>
                  </div>

                  {deleteError && (
                    <div role="alert" className="bg-red/10 border border-red/30 text-red text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {deleteError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="profile-deleteConfirm" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Type DELETE to confirm
                    </label>
                    <input
                      id="profile-deleteConfirm"
                      type="text"
                      value={deleteTyped}
                      onChange={(e) => setDeleteTyped(e.target.value)}
                      className="w-full bg-off-white border border-red/20 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                      placeholder="DELETE"
                      autoComplete="off"
                    />
                  </div>

                  {!isOAuthUser && (
                    <div>
                      <label htmlFor="profile-deletePw" className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Enter your password
                      </label>
                      <input
                        id="profile-deletePw"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full bg-off-white border border-red/20 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
                        placeholder="Your current password"
                        autoComplete="current-password"
                      />
                    </div>
                  )}

                  {isOAuthUser && (
                    <p className="text-text-muted text-xs">
                      Your account uses Google sign-in — no password needed.
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={deleting || deleteTyped !== "DELETE" || (!isOAuthUser && !deletePassword)}
                      className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Permanently Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                        setDeleteTyped("");
                        setDeleteError("");
                      }}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider text-text-muted hover:text-navy bg-off-white hover:bg-off-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
