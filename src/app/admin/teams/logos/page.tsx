"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageIcon, Trash2, Loader2, Upload, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TeamLogo from "@/components/ui/TeamLogo";
import LogoUploader from "@/components/ui/LogoUploader";

export default function LogoManagementPage() {
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [customTeam, setCustomTeam] = useState("");

  const fetchLogos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams/logo");
      if (res.ok) setLogos(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogos(); }, [fetchLogos]);

  async function handleDelete(teamName: string) {
    if (!confirm(`Remove logo for "${teamName}"?`)) return;
    setDeletingKey(teamName);
    try {
      const res = await fetch(`/api/teams/logo?teamName=${encodeURIComponent(teamName)}`, { method: "DELETE" });
      if (res.ok) {
        setLogos((prev) => {
          const next = { ...prev };
          delete next[teamName];
          return next;
        });
      }
    } finally {
      setDeletingKey(null);
    }
  }

  const entries = Object.entries(logos);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/teams" className="text-text-secondary hover:text-navy transition-colors text-xs flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Teams
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Team Logos
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Manage uploaded logos for all teams — {entries.length} logo{entries.length !== 1 ? "s" : ""} stored
          </p>
        </div>
        <button
          onClick={fetchLogos}
          className="flex items-center gap-2 text-text-secondary hover:text-navy transition-colors text-xs border border-border rounded-sm px-3 py-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Upload for custom team name */}
      <div className="bg-bg-secondary border border-border rounded-sm p-4 mb-6">
        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3">Upload logo for a team</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="logos-teamName" className="block text-text-secondary text-xs mb-1.5">Team Name</label>
            <input
              id="logos-teamName"
              type="text"
              value={customTeam}
              onChange={(e) => setCustomTeam(e.target.value)}
              placeholder="Enter exact team name..."
              className="w-full bg-bg border border-border rounded-sm px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent placeholder:text-text-secondary/50"
            />
          </div>
          {customTeam.trim() && (
            <LogoUploader
              teamName={customTeam.trim()}
              currentLogoUrl={logos[customTeam.trim()]}
              onSuccess={(url) => {
                setLogos((prev) => ({ ...prev, [customTeam.trim()]: url }));
                setCustomTeam("");
              }}
              variant="card"
            />
          )}
        </div>
      </div>

      {/* Logos grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading logos…
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-sm p-10 text-center">
          <ImageIcon className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
          <p className="text-navy font-semibold mb-1">No logos uploaded yet</p>
          <p className="text-text-secondary text-sm mb-4">
            Upload logos from the Teams page by expanding any team row, or use the form above.
          </p>
          <Link
            href="/admin/teams"
            className="inline-flex items-center gap-2 text-accent text-sm font-semibold hover:text-accent-hover transition-colors"
          >
            <Upload className="w-4 h-4" /> Go to Teams
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {entries.map(([teamName, url]) => (
            <div
              key={teamName}
              className="bg-bg-secondary border border-border rounded-sm p-4 flex flex-col items-center gap-3 group"
            >
              <TeamLogo teamName={teamName} logoUrl={url} size={64} />
              <p className="text-navy text-xs font-semibold text-center leading-tight line-clamp-2">
                {teamName}
              </p>
              <p className="text-text-secondary text-[10px] text-center truncate w-full" title={url}>
                {url.split("/").pop()}
              </p>
              <div className="flex gap-2 w-full">
                <LogoUploader
                  teamName={teamName}
                  currentLogoUrl={url}
                  onSuccess={(newUrl) => setLogos((prev) => ({ ...prev, [teamName]: newUrl }))}
                  variant="button"
                />
                <button
                  onClick={() => handleDelete(teamName)}
                  disabled={deletingKey === teamName}
                  title="Delete logo"
                  className="flex-1 flex items-center justify-center gap-1.5 border border-border hover:border-red/40 hover:text-red text-text-secondary rounded px-2 py-1.5 text-xs transition-colors disabled:opacity-40"
                >
                  {deletingKey === teamName ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5" /> Delete</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
