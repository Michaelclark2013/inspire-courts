"use client";

import { useState } from "react";
import { triggerHaptic } from "@/lib/capacitor";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Users,
  Shield,
  Flag,
  ClipboardList,
  Heart,
  Check,
  X,
} from "lucide-react";

const PRIMARY_ROLES = [
  {
    value: "coach",
    label: "Coach",
    icon: ClipboardList,
    description: "Manage roster, check-in players, waivers, schedule",
    color: "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10",
    activeColor: "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    value: "parent",
    label: "Parent / Player",
    icon: Heart,
    description: "View schedules, submit waivers, see scores",
    color: "border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10",
    activeColor: "border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-500/30",
    iconColor: "text-cyan-400",
  },
];

const STAFF_ROLES = [
  {
    value: "staff",
    label: "Staff",
    icon: Users,
    description: "Score entry, schedules — requires admin approval",
    color: "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
    activeColor: "border-blue-400 bg-blue-500/20 ring-1 ring-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    value: "ref",
    label: "Referee",
    icon: Flag,
    description: "Work history, referee checkout — requires admin approval",
    color: "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
    activeColor: "border-amber-400 bg-amber-500/20 ring-1 ring-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    value: "front_desk",
    label: "Front Desk",
    icon: Shield,
    description: "Check-in, scores, schedules — requires admin approval",
    color: "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
    activeColor: "border-purple-400 bg-purple-500/20 ring-1 ring-purple-500/30",
    iconColor: "text-purple-400",
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState<"role" | "details" | "done" | "pending">("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [showStaffRoles, setShowStaffRoles] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      triggerHaptic("success");

      // Staff/ref need admin approval — don't auto-login
      if (data.pendingApproval) {
        setStep("pending");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        setStep("done");
        setTimeout(() => {
          router.push("/portal");
        }, 1500);
      } else {
        // Registration succeeded but auto-login failed — just redirect to login
        setStep("done");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/inspire-athletics-logo.png"
            alt="Inspire Athletics"
            width={70}
            height={70}
            className="object-contain mx-auto mb-4"
            priority
          />
          <h1 className="text-white text-xl font-bold uppercase tracking-widest mb-1">
            Inspire Courts
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
            Create Your Account
          </p>
        </div>

        {/* Success state */}
        {step === "done" && (
          <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-8 shadow-2xl text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-white text-lg font-bold mb-2">Account Created!</h2>
            <p className="text-white/50 text-sm">Signing you in...</p>
          </div>
        )}

        {/* Pending approval state */}
        {step === "pending" && (
          <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-8 shadow-2xl text-center">
            <Shield className="w-14 h-14 text-amber-400 mx-auto mb-4" />
            <h2 className="text-white text-lg font-bold mb-2">Pending Approval</h2>
            <p className="text-white/50 text-sm mb-2">
              Your account has been created but requires admin approval before you can sign in.
            </p>
            <p className="text-white/40 text-xs mb-6">
              The facility admin will review and approve your {selectedRole === "ref" ? "referee" : "staff"} account.
              You&apos;ll be able to sign in once approved.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}

        {/* Step 1: Role selection */}
        {step === "role" && (
          <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red" />
              <h2 className="text-white text-sm font-bold uppercase tracking-wider">
                I am a...
              </h2>
            </div>
            <p className="text-white/40 text-xs mb-5">
              Select your role to get started
            </p>

            {/* Primary roles — Coach & Parent */}
            <div className="space-y-3">
              {PRIMARY_ROLES.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      isActive ? role.activeColor : role.color
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-white/10" : "bg-white/5"}`}>
                      <Icon className={`w-5 h-5 ${role.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{role.label}</p>
                      <p className="text-white/40 text-xs">{role.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? "border-white bg-white" : "border-white/20"
                    }`}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-navy" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Staff/Ref — collapsible, less prominent */}
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowStaffRoles(!showStaffRoles)}
                aria-expanded={showStaffRoles}
                className="text-white/30 hover:text-white/50 text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                {showStaffRoles ? "Hide" : "Staff or Referee?"}
              </button>
              {showStaffRoles && (
                <div className="space-y-2 mt-3">
                  <p className="text-amber-400/60 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Requires admin approval
                  </p>
                  {STAFF_ROLES.map((role) => {
                    const Icon = role.icon;
                    const isActive = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isActive ? role.activeColor : role.color
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-white/10" : "bg-white/5"}`}>
                          <Icon className={`w-4 h-4 ${role.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 font-semibold text-xs">{role.label}</p>
                          <p className="text-white/30 text-[10px]">{role.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isActive ? "border-white bg-white" : "border-white/15"
                        }`}>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-navy" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (selectedRole) setStep("details");
              }}
              disabled={!selectedRole}
              className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all mt-6 shadow-lg shadow-red/20"
            >
              Continue
            </button>

            <div className="mt-5 text-center">
              <span className="text-white/50 text-xs">Already have an account? </span>
              <Link href="/login" className="text-red text-xs hover:text-red-hover transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Account details */}
        {step === "details" && (
          <div className="bg-navy-light/80 backdrop-blur border border-white/10 rounded-xl p-7 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-red" />
              <h2 className="text-white text-sm font-bold uppercase tracking-wider">
                Your Details
              </h2>
            </div>
            <p className="text-white/40 text-xs mb-5">
              Signing up as{" "}
              <span className="text-white/70 font-semibold capitalize">{selectedRole}</span>
              {" · "}
              <button
                onClick={() => setStep("role")}
                className="text-red hover:text-red-hover transition-colors"
              >
                Change
              </button>
            </p>

            {error && (
              <div className="bg-red/10 border border-red/30 text-red-hover text-sm rounded-lg px-4 py-3 mb-4" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 pr-12 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password.length > 0 && <PasswordStrength password={form.password} />}
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Phone <span className="text-white/20">(optional)</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    let formatted = "";
                    if (digits.length === 0) formatted = "";
                    else if (digits.length <= 3) formatted = `(${digits}`;
                    else if (digits.length <= 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                    else formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                    setForm({ ...form, phone: formatted });
                  }}
                  autoComplete="tel"
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-white/25"
                  placeholder="(555) 123-4567"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-red/20 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Google sign up option */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-navy-light/80 px-3 text-white/30 uppercase tracking-wider">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/login" })}
              className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 text-gray-800 py-3.5 rounded-lg font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              aria-label="Sign up with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>

            <div className="mt-5 text-center">
              <span className="text-white/50 text-xs">Already have an account? </span>
              <Link href="/login" className="text-red text-xs hover:text-red-hover transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-8 uppercase tracking-widest">
          Inspire Courts AZ &bull; Gilbert, Arizona
        </p>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const colors = ["bg-red", "bg-red", "bg-amber-500", "bg-emerald-500"];
  const barColor = passed === 0 ? "bg-white/10" : colors[passed - 1];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < passed ? barColor : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-[10px]">
            {c.pass ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <X className="w-3 h-3 text-white/20" />
            )}
            <span className={c.pass ? "text-emerald-400" : "text-white/30"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
