"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

/**
 * Cross-page Message action for rows that only carry an email (no
 * userId). Resolves email→user.id via /api/admin/messages/resolve and
 * navigates to /admin/messages?to=USER_ID. Falls back to mailto: if no
 * portal account exists.
 *
 * Used wherever the underlying record only stores contact info (e.g.
 * tournament team registrations carry a coachEmail but no FK to a
 * user row).
 */
export function MessageByEmailButton({
  email,
  label = "Message",
  className,
  fallbackSubject,
}: {
  email: string;
  label?: string;
  className?: string;
  fallbackSubject?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function handleClick() {
    if (busy || !email) return;
    setBusy(true);
    setHint(null);
    try {
      const res = await adminFetch(`/api/admin/messages/resolve?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = (await res.json()) as { user?: { id: number } };
        if (data.user?.id) {
          router.push(`/admin/messages?to=${data.user.id}`);
          return;
        }
      }
      // 404 / no portal account → fall back to email so the action
      // still does *something* useful instead of a dead button.
      const subject = fallbackSubject ? `?subject=${encodeURIComponent(fallbackSubject)}` : "";
      window.location.href = `mailto:${email}${subject}`;
      setHint("No portal account — opening email instead.");
    } catch {
      setHint("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={hint || `Message ${email}`}
      className={
        className ||
        "inline-flex items-center gap-1 text-xs text-navy hover:text-red disabled:opacity-50"
      }
    >
      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
