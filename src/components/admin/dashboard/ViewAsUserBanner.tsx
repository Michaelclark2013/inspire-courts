"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, X, User } from "lucide-react";

type ViewAs = {
  active: boolean;
  target?: { id: number; name: string; role: string };
};

// Floating banner that's visible site-wide across /admin whenever the
// main admin has "View as user" mode active. Tells them they're
// seeing the site through another user's eyes + gives them a one-
// click exit.
export default function ViewAsUserBanner() {
  const [status, setStatus] = useState<ViewAs>({ active: false });
  const router = useRouter();

  async function refresh() {
    try {
      const res = await fetch("/api/admin/permissions/view-as");
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
  }

  useEffect(() => { refresh(); }, []);

  async function exit() {
    await fetch("/api/admin/permissions/view-as", { method: "DELETE" });
    await refresh();
    router.refresh();
  }

  if (!status.active || !status.target) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-sm font-semibold shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <Eye className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="uppercase text-[10px] tracking-widest font-bold bg-white/20 px-2 py-0.5 rounded-full flex-shrink-0">
            Previewing
          </span>
          <User className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">
            {status.target.name} <span className="text-white/70 font-normal">· {status.target.role}</span>
          </span>
        </div>
        <button
          onClick={exit}
          className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors flex-shrink-0"
        >
          <X className="w-3 h-3" aria-hidden="true" />
          Exit preview
        </button>
      </div>
    </div>
  );
}
