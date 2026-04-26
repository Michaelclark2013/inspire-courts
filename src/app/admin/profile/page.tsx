"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  User,
  ArrowLeft,
  Save,
  Phone,
  MapPin,
  CalendarDays,
  AlertCircle,
  Lock,
  LogOut,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Palette,
  BellRing,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type NotificationPrefs = {
  email?: { announcements?: boolean; gameReminders?: boolean; weekly?: boolean };
  push?: { announcements?: boolean; gameReminders?: boolean };
};

type Me = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notificationPrefsJson: string | null;
  memberSince: string | null;
  emailVerifiedAt: string | null;
  profileComplete: boolean;
  createdAt: string;
};

function parsePrefs(json: string | null): NotificationPrefs {
  if (!json) return {};
  try { return JSON.parse(json) as NotificationPrefs; } catch { return {}; }
}

function prefOn(prefs: NotificationPrefs, path: string): boolean {
  // null or missing = opt-in by default
  const [channel, key] = path.split(".");
  const c = (prefs as Record<string, Record<string, boolean>>)[channel];
  if (!c) return true;
  const v = c[key];
  return v === undefined ? true : v;
}

export default function MyProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state mirrors the editable subset of fields.
  const [form, setForm] = useState({
    name: "", phone: "", photoUrl: "",
    birthDate: "",
    emergencyContactName: "", emergencyContactPhone: "",
    addressLine: "", city: "", state: "", postalCode: "",
  });

  // Change-password state
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwNext2, setPwNext2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/me/profile");
      if (!res.ok) throw new Error(`load ${res.status}`);
      const data = (await res.json()) as Me;
      setMe(data);
      setForm({
        name: data.name ?? "",
        phone: data.phone ?? "",
        photoUrl: data.photoUrl ?? "",
        birthDate: data.birthDate ?? "",
        emergencyContactName: data.emergencyContactName ?? "",
        emergencyContactPhone: data.emergencyContactPhone ?? "",
        addressLine: data.addressLine ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        postalCode: data.postalCode ?? "",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwError(null);
    setPwMsg(null);
    try {
      if (pwNext !== pwNext2) throw new Error("Passwords don't match");
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", current: pwCurrent, next: pwNext }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      setPwMsg("Password updated");
      setPwCurrent(""); setPwNext(""); setPwNext2("");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  async function resendVerification() {
    try {
      await fetch("/api/auth/verify-email/resend", { method: "POST" });
      alert("Verification email sent (check your inbox).");
    } catch { /* noop */ }
  }

  if (loading) return <div className="p-8"><SkeletonRows count={5} /></div>;
  if (error && !me) return <div className="p-8 text-red">{error}</div>;
  if (!me) return <div className="p-8 text-text-muted">Not found</div>;

  // Guarded: if `me.name` is somehow null/empty (kiosk-created user, manual
  // DB nulling), `.split` would throw and crash the whole profile page —
  // making the form unreachable for the very user who needs it most.
  const safeName = (me.name || "").trim();
  const initials = safeName
    ? safeName.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {me.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border border-white/20" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-white font-heading text-3xl font-bold">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1">My Profile</p>
            <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight">{safeName || "(no name)"}</h1>
            <p className="text-white/60 text-sm mt-1 flex items-center gap-2 flex-wrap">
              <Mail className="w-3.5 h-3.5" /> {me.email}
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{me.role}</span>
              {me.emailVerifiedAt ? (
                <span className="bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <button onClick={resendVerification} className="bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Resend verification
                </button>
              )}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </section>

      {!me.profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-sm">
            <strong>Profile incomplete.</strong> Add your date of birth and emergency contact below so we can verify eligibility for events.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main edit form */}
        <form onSubmit={save} className="lg:col-span-2 space-y-6">
          <Card title="Account" icon={<User className="w-4 h-4 text-red" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={ipt} />
              </Field>
              <Field label="Phone">
                <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={ipt} placeholder="(555) 123-4567" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Profile Photo URL">
                  <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} className={ipt} placeholder="https://..." />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Eligibility" icon={<CalendarDays className="w-4 h-4 text-red" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date of Birth">
                <input type="date" value={form.birthDate || ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className={ipt} />
              </Field>
            </div>
          </Card>

          <Card title="Emergency Contact" icon={<Phone className="w-4 h-4 text-red" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className={ipt} />
              </Field>
              <Field label="Phone">
                <input type="tel" inputMode="tel" autoComplete="tel" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} className={ipt} placeholder="(555) 123-4567" />
              </Field>
            </div>
          </Card>

          <Card title="Address" icon={<MapPin className="w-4 h-4 text-red" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Street">
                  <input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} className={ipt} />
                </Field>
              </div>
              <Field label="City">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={ipt} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="State">
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={ipt} maxLength={2} />
                </Field>
                <Field label="ZIP">
                  <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className={ipt} />
                </Field>
              </div>
            </div>
          </Card>

          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider flex items-center gap-2">
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && (
              <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
          </div>
        </form>

        {/* Right column */}
        <div className="space-y-6">
          <Card title="Change Password" icon={<Lock className="w-4 h-4 text-red" />}>
            <form onSubmit={changePassword} className="space-y-3">
              <Field label="Current Password">
                <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} className={ipt} autoComplete="current-password" />
              </Field>
              <Field label="New Password">
                <input type="password" value={pwNext} onChange={(e) => setPwNext(e.target.value)} className={ipt} autoComplete="new-password" />
              </Field>
              <Field label="Confirm New">
                <input type="password" value={pwNext2} onChange={(e) => setPwNext2(e.target.value)} className={ipt} autoComplete="new-password" />
              </Field>
              {pwError && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-3 py-2 text-xs">{pwError}</div>}
              {pwMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-xs">{pwMsg}</div>}
              <button type="submit" disabled={pwBusy} className="w-full bg-navy hover:bg-navy/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider">
                {pwBusy ? "Updating…" : "Update Password"}
              </button>
            </form>
          </Card>

          <Card title="Appearance" icon={<Palette className="w-4 h-4 text-red" />}>
            <ThemeToggle />
            <p className="text-text-muted text-xs mt-3">
              Device preference saved locally — affects only this browser.
            </p>
          </Card>

          <NotificationPrefsCard me={me} onSaved={load} />

          <Card title="Quick Links" icon={<ShieldCheck className="w-4 h-4 text-red" />}>
            <div className="space-y-2">
              <Link href="/admin/my-schedule" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm text-navy font-semibold transition-colors">
                My Schedule
                <span className="text-text-muted text-xs">→</span>
              </Link>
              <Link href="/admin/my-history" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm text-navy font-semibold transition-colors">
                My History
                <span className="text-text-muted text-xs">→</span>
              </Link>
              <Link href="/portal/profile" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm text-navy font-semibold transition-colors">
                Portal Profile
                <span className="text-text-muted text-xs">→</span>
              </Link>
            </div>
          </Card>

          <div className="bg-white border border-border rounded-2xl shadow-sm p-5 text-xs text-text-muted">
            <p><span className="font-bold text-navy">Member since:</span> {me.memberSince || new Date(me.createdAt).getFullYear()}</p>
            <p className="mt-1"><span className="font-bold text-navy">Account ID:</span> #{me.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ipt = "w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60";

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function NotificationPrefsCard({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const initial = parsePrefs(me.notificationPrefsJson);
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(path: string) {
    const [channel, key] = path.split(".");
    setPrefs((p) => {
      const next = { ...p };
      const c = { ...((next as Record<string, Record<string, boolean>>)[channel] || {}) };
      c[key] = !prefOn(p, path);
      (next as Record<string, Record<string, boolean>>)[channel] = c;
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    try {
      await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPrefs: prefs }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } finally { setBusy(false); }
  }

  const items: Array<{ path: string; label: string }> = [
    { path: "email.announcements", label: "Announcement emails" },
    { path: "email.gameReminders", label: "Game day email reminders" },
    { path: "email.weekly", label: "Weekly digest email" },
    { path: "push.announcements", label: "Announcement push notifications" },
    { path: "push.gameReminders", label: "Game day push reminders" },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        <BellRing className="w-4 h-4 text-red" /> Notifications
      </h2>
      <div className="space-y-2">
        {items.map((i) => {
          const on = prefOn(prefs, i.path);
          return (
            <button
              key={i.path}
              onClick={() => toggle(i.path)}
              className={`w-full flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                on ? "text-navy" : "text-text-muted"
              }`}
            >
              <span className="text-left">{i.label}</span>
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-red" : "bg-border"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={save}
        disabled={busy}
        className="mt-4 w-full bg-navy hover:bg-navy/90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl"
      >
        {busy ? "Saving…" : saved ? "Saved ✓" : "Save Preferences"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
