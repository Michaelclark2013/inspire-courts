"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Save, Check, RefreshCw, Plus, Trash2 } from "lucide-react";
import type { SiteContent } from "@/lib/content";

export default function ContentEditorPage() {
  const { data: session, status } = useSession();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/admin/login");
  }, [status]);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then(setContent);
  }, []);

  async function save() {
    if (!content) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!content) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  function update(section: string, key: string, value: any) {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, [section]: { ...(prev as any)[section], [key]: value } };
    });
  }

  const TABS = [
    { id: "hero", label: "Hero" },
    { id: "stats", label: "Stats Bar" },
    { id: "about", label: "About" },
    { id: "facility", label: "Facility" },
    { id: "gameday", label: "Game Day" },
    { id: "testimonials", label: "Testimonials" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
            Content Editor
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Edit website content without touching code
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-5 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved
            </>
          ) : saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-accent text-white"
                : "bg-bg border border-border text-text-secondary hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero */}
      {activeTab === "hero" && (
        <div className="bg-bg-secondary border border-border rounded-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Homepage Hero
          </h3>
          <Field
            label="Headline"
            value={content.hero.headline}
            onChange={(v) => update("hero", "headline", v)}
          />
          <Field
            label="Subheadline"
            value={content.hero.subheadline}
            onChange={(v) => update("hero", "subheadline", v)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Primary CTA Text"
              value={content.hero.ctaPrimary}
              onChange={(v) => update("hero", "ctaPrimary", v)}
            />
            <Field
              label="Secondary CTA Text"
              value={content.hero.ctaSecondary}
              onChange={(v) => update("hero", "ctaSecondary", v)}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {activeTab === "stats" && (
        <div className="bg-bg-secondary border border-border rounded-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Stats Bar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Teams Hosted"
              value={content.stats.teamsHosted}
              onChange={(v) => update("stats", "teamsHosted", v)}
            />
            <Field
              label="Tournaments"
              value={content.stats.tournaments}
              onChange={(v) => update("stats", "tournaments", v)}
            />
            <Field
              label="Players"
              value={content.stats.players}
              onChange={(v) => update("stats", "players", v)}
            />
            <Field
              label="Film Coverage"
              value={content.stats.filmCoverage}
              onChange={(v) => update("stats", "filmCoverage", v)}
            />
          </div>
        </div>
      )}

      {/* About */}
      {activeTab === "about" && (
        <div className="bg-bg-secondary border border-border rounded-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            About Page
          </h3>
          <Field
            label="Headline"
            value={content.about.headline}
            onChange={(v) => update("about", "headline", v)}
          />
          <Field
            label="Story"
            value={content.about.story}
            onChange={(v) => update("about", "story", v)}
            multiline
          />
          <Field
            label="Mission Statement"
            value={content.about.mission}
            onChange={(v) => update("about", "mission", v)}
          />
        </div>
      )}

      {/* Facility */}
      {activeTab === "facility" && (
        <div className="bg-bg-secondary border border-border rounded-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Facility Section
          </h3>
          <Field
            label="Headline"
            value={content.facility.headline}
            onChange={(v) => update("facility", "headline", v)}
          />
          <Field
            label="Description"
            value={content.facility.description}
            onChange={(v) => update("facility", "description", v)}
          />
          <div className="space-y-3">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
              Features
            </p>
            {content.facility.features.map((feature, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => {
                      const features = [...content.facility.features];
                      features[i] = { ...features[i], title: e.target.value };
                      update("facility", "features", features);
                    }}
                    className="bg-bg border border-border rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                    placeholder="Feature title"
                  />
                  <input
                    type="text"
                    value={feature.description}
                    onChange={(e) => {
                      const features = [...content.facility.features];
                      features[i] = { ...features[i], description: e.target.value };
                      update("facility", "features", features);
                    }}
                    className="bg-bg border border-border rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                    placeholder="Description"
                  />
                </div>
                <button
                  onClick={() => {
                    const features = content.facility.features.filter((_, j) => j !== i);
                    update("facility", "features", features);
                  }}
                  className="text-text-secondary hover:text-danger p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                update("facility", "features", [
                  ...content.facility.features,
                  { title: "", description: "" },
                ]);
              }}
              className="flex items-center gap-1 text-accent text-xs font-bold uppercase tracking-wide hover:text-accent-hover"
            >
              <Plus className="w-3 h-3" /> Add Feature
            </button>
          </div>
        </div>
      )}

      {/* Game Day */}
      {activeTab === "gameday" && (
        <div className="bg-bg-secondary border border-border rounded-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Game Day Info
          </h3>
          <Field
            label="Admission Price"
            value={content.gameday.admissionPrice}
            onChange={(v) => update("gameday", "admissionPrice", v)}
          />
          <Field
            label="Parking Note"
            value={content.gameday.parkingNote}
            onChange={(v) => update("gameday", "parkingNote", v)}
          />
          <Field
            label="Schedule Note"
            value={content.gameday.scheduleNote}
            onChange={(v) => update("gameday", "scheduleNote", v)}
          />
        </div>
      )}

      {/* Testimonials */}
      {activeTab === "testimonials" && (
        <div className="bg-bg-secondary border border-border rounded-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Testimonials
          </h3>
          {content.testimonials.items.map((t, i) => (
            <div key={i} className="bg-bg border border-border rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-text-secondary text-xs font-bold uppercase">
                  Testimonial {i + 1}
                </span>
                <button
                  onClick={() => {
                    const items = content.testimonials.items.filter((_, j) => j !== i);
                    update("testimonials", "items", items);
                  }}
                  className="text-text-secondary hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={t.quote}
                onChange={(e) => {
                  const items = [...content.testimonials.items];
                  items[i] = { ...items[i], quote: e.target.value };
                  update("testimonials", "items", items);
                }}
                rows={2}
                className="w-full bg-bg-secondary border border-border rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-accent resize-vertical"
                placeholder="Quote"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => {
                    const items = [...content.testimonials.items];
                    items[i] = { ...items[i], name: e.target.value };
                    update("testimonials", "items", items);
                  }}
                  className="bg-bg-secondary border border-border rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={t.team}
                  onChange={(e) => {
                    const items = [...content.testimonials.items];
                    items[i] = { ...items[i], team: e.target.value };
                    update("testimonials", "items", items);
                  }}
                  className="bg-bg-secondary border border-border rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                  placeholder="Team / Location"
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              update("testimonials", "items", [
                ...content.testimonials.items,
                { quote: "", name: "", team: "" },
              ]);
            }}
            className="flex items-center gap-1 text-accent text-xs font-bold uppercase tracking-wide hover:text-accent-hover"
          >
            <Plus className="w-3 h-3" /> Add Testimonial
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-white text-xs font-bold uppercase tracking-wider mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full bg-bg border border-border rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors resize-vertical"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-bg border border-border rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors"
        />
      )}
    </div>
  );
}
