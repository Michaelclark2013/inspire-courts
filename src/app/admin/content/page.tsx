"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Save,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Image,
  Type,
  AlignLeft,
  List,
  X,
  Clock,
} from "lucide-react";
import type { SiteContent, ContentSection } from "@/lib/content";

const DRAFT_KEY = "cms-draft-v1";
const TIMESTAMPS_KEY = "cms-timestamps-v1";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ContentEditorPage() {
  const { status } = useSession();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["0"]));
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());
  const [sectionTimestamps, setSectionTimestamps] = useState<Record<string, string>>({});
  const [draftBanner, setDraftBanner] = useState(false);
  const savedContentRef = useRef<SiteContent | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/admin/login");
  }, [status]);

  // Load timestamps from localStorage
  useEffect(() => {
    try {
      const ts = localStorage.getItem(TIMESTAMPS_KEY);
      if (ts) setSectionTimestamps(JSON.parse(ts));
    } catch {}
  }, []);

  // Fetch content from server, check for draft
  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((serverContent: SiteContent) => {
        savedContentRef.current = serverContent;
        try {
          const draft = localStorage.getItem(DRAFT_KEY);
          if (draft) {
            const { content: draftContent, savedAt } = JSON.parse(draft);
            const ageMin = (Date.now() - savedAt) / 60000;
            if (ageMin < 60 * 24) {
              setContent(draftContent);
              setDirty(true);
              setDraftBanner(true);
              return;
            } else {
              localStorage.removeItem(DRAFT_KEY);
            }
          }
        } catch {}
        setContent(serverContent);
      });
  }, []);

  // Auto-save draft to localStorage (debounced 800ms)
  useEffect(() => {
    if (!content || !dirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, savedAt: Date.now() }));
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [content, dirty]);

  function showToast(msg: string, type: "success" | "error") {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(
      () => setToast(null),
      type === "success" ? 3000 : 5000
    );
  }

  const save = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        savedContentRef.current = content;
        setSaved(true);
        setDirty(false);
        setDraftBanner(false);
        setDirtySections((prevDirty) => {
          // Update timestamps for dirty sections then clear
          setSectionTimestamps((prev) => {
            const now = new Date().toISOString();
            const next = { ...prev };
            prevDirty.forEach((k) => {
              next[k] = now;
            });
            try {
              localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
          return new Set();
        });
        localStorage.removeItem(DRAFT_KEY);
        showToast("Changes saved successfully!", "success");
        setTimeout(() => setSaved(false), 3000);
      } else {
        showToast("Failed to save — please try again", "error");
      }
    } catch {
      showToast("Network error — please try again", "error");
    }
    setSaving(false);
  }, [content]);

  function discard() {
    if (!savedContentRef.current) return;
    if (!confirm("Discard all unsaved changes?")) return;
    setContent(savedContentRef.current);
    setDirty(false);
    setDraftBanner(false);
    setDirtySections(new Set());
    localStorage.removeItem(DRAFT_KEY);
  }

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  function toggleAllSections() {
    if (!content) return;
    const allKeys = content.pages[activePage].sections.map((_, i) => String(i));
    const allExpanded = allKeys.every((k) => expandedSections.has(k));
    setExpandedSections(allExpanded ? new Set() : new Set(allKeys));
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function markSectionDirty(pageId: string, sectionIdx: number) {
    setDirty(true);
    setDirtySections((prev) => new Set([...prev, `${pageId}:${sectionIdx}`]));
  }

  function updateField(pageId: string, sectionIdx: number, fieldKey: string, value: string) {
    markSectionDirty(pageId, sectionIdx);
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].fields[fieldKey].value = value;
      return updated;
    });
  }

  function updateListItem(
    pageId: string,
    sectionIdx: number,
    itemIdx: number,
    fieldKey: string,
    value: string
  ) {
    markSectionDirty(pageId, sectionIdx);
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].list!.items[itemIdx][fieldKey] = value;
      return updated;
    });
  }

  function addListItem(pageId: string, sectionIdx: number) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      const list = updated.pages[pageId].sections[sectionIdx].list!;
      const newItem: { [key: string]: string } = {};
      list.itemFields.forEach((f) => (newItem[f] = ""));
      list.items.push(newItem);
      return updated;
    });
  }

  function removeListItem(pageId: string, sectionIdx: number, itemIdx: number) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].list!.items.splice(itemIdx, 1);
      return updated;
    });
  }

  function addSection(pageId: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      const newSection: ContentSection = {
        name: "New Section",
        fields: {
          headline: { label: "Headline", value: "", type: "text" },
          description: { label: "Description", value: "", type: "textarea" },
        },
      };
      updated.pages[pageId].sections.push(newSection);
      const newIdx = String(updated.pages[pageId].sections.length - 1);
      setExpandedSections((prev) => new Set([...prev, newIdx]));
      return updated;
    });
  }

  function removeSection(pageId: string, sectionIdx: number) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections.splice(sectionIdx, 1);
      return updated;
    });
  }

  function addField(pageId: string, sectionIdx: number, type: "text" | "textarea" | "image") {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      const section = updated.pages[pageId].sections[sectionIdx];
      const fieldCount = Object.keys(section.fields).length;
      const key = `custom_${fieldCount + 1}`;
      section.fields[key] = {
        label: type === "image" ? "Image URL" : "New Field",
        value: "",
        type,
      };
      return updated;
    });
  }

  function removeField(pageId: string, sectionIdx: number, fieldKey: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      delete updated.pages[pageId].sections[sectionIdx].fields[fieldKey];
      return updated;
    });
  }

  function updateFieldLabel(pageId: string, sectionIdx: number, fieldKey: string, label: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].fields[fieldKey].label = label;
      return updated;
    });
  }

  function updateSectionName(pageId: string, sectionIdx: number, name: string) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].name = name;
      return updated;
    });
  }

  function addListToSection(pageId: string, sectionIdx: number) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].list = {
        label: "Items",
        itemFields: ["title", "description"],
        items: [],
      };
      return updated;
    });
  }

  if (!content) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-red animate-spin" />
      </div>
    );
  }

  const pageIds = Object.keys(content.pages);
  const currentPage = content.pages[activePage];

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-32">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border ${
            toast.type === "success"
              ? "bg-green-500/20 border-green-500/40 text-green-400"
              : "bg-red/20 border-red/40 text-red"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            className="ml-1 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Draft restored banner */}
      {draftBanner && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <span className="text-amber-400 font-semibold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Draft restored from auto-save
          </span>
          <div className="flex gap-3">
            <button
              onClick={discard}
              className="text-navy/50 hover:text-navy text-xs font-bold uppercase tracking-wide transition-colors"
            >
              Discard
            </button>
            <button
              onClick={save}
              className="text-amber-400 hover:text-amber-300 text-xs font-bold uppercase tracking-wide transition-colors"
            >
              Save Now
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-[var(--font-chakra)]">
            Content Editor
          </h1>
          <p className="text-navy/60 text-sm mt-1 hidden md:block">
            Edit all text, images, and content across the website
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {dirty && (
            <span className="hidden sm:flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Saved!</span>
              </>
            ) : saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex items-center gap-3 mb-4 md:mb-8">
        <div className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1">
          {pageIds.map((id) => {
            const pageHasDirty = [...dirtySections].some((k) => k.startsWith(id + ":"));
            return (
              <button
                key={id}
                onClick={() => {
                  setActivePage(id);
                  setExpandedSections(new Set(["0"]));
                }}
                className={`relative px-3 md:px-4 py-2 md:py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
                  activePage === id
                    ? "bg-red text-white"
                    : "bg-white/10 text-navy/60 hover:text-navy hover:bg-white/20"
                }`}
              >
                {content.pages[id].label}
                {pageHasDirty && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-black" />
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={toggleAllSections}
          className="flex items-center gap-1.5 text-navy/40 hover:text-navy text-xs font-bold uppercase tracking-wide transition-colors flex-shrink-0"
          title="Expand/collapse all sections"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Page Sections */}
      <div className="space-y-3 md:space-y-4">
        {currentPage.sections.map((section, sIdx) => {
          const sKey = String(sIdx);
          const isExpanded = expandedSections.has(sKey);
          const dirtyKey = `${activePage}:${sIdx}`;
          const isSectionDirty = dirtySections.has(dirtyKey);
          const lastEdited = sectionTimestamps[dirtyKey];

          return (
            <div
              key={sIdx}
              className={`bg-white/5 border rounded-xl overflow-hidden transition-colors ${
                isSectionDirty
                  ? "border-amber-500/50 ring-1 ring-amber-500/20"
                  : "border-white/10"
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sKey)}
                className="w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-navy/40 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-navy/40 flex-shrink-0" />
                  )}
                  <span className="text-navy font-bold text-sm uppercase tracking-wide truncate">
                    {section.name}
                  </span>
                  <span className="text-navy/30 text-xs flex-shrink-0">
                    {Object.keys(section.fields).length}f
                    {section.list ? ` +${section.list.items.length}` : ""}
                  </span>
                  {isSectionDirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
                {lastEdited && !isSectionDirty && (
                  <span className="hidden sm:flex items-center gap-1 text-navy/25 text-[10px] flex-shrink-0 ml-2">
                    <Clock className="w-3 h-3" />
                    {timeAgo(lastEdited)}
                  </span>
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4 md:space-y-5">
                  {/* Section name editor */}
                  <div className="flex items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b border-white/10">
                    <label className="text-navy/40 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      Name:
                    </label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSectionName(activePage, sIdx, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-navy text-[16px] md:text-sm focus:outline-none focus:border-red transition-colors flex-1"
                    />
                    <button
                      onClick={() => removeSection(activePage, sIdx)}
                      className="text-navy/30 hover:text-red-400 p-1 transition-colors flex-shrink-0"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fields */}
                  {Object.entries(section.fields).map(([key, field]) => (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-2">
                        {field.type === "image" ? (
                          <Image className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        ) : field.type === "textarea" ? (
                          <AlignLeft className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <Type className="w-3.5 h-3.5 text-navy/40 flex-shrink-0" />
                        )}
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateFieldLabel(activePage, sIdx, key, e.target.value)
                          }
                          className="bg-transparent text-navy/70 text-xs font-bold uppercase tracking-wider focus:outline-none focus:text-navy border-b border-transparent focus:border-white/20 pb-0.5 flex-1 min-w-0"
                        />
                        <button
                          onClick={() => removeField(activePage, sIdx, key)}
                          className="text-navy/20 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {field.type === "textarea" ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => updateField(activePage, sIdx, key, e.target.value)}
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-navy text-[16px] md:text-sm focus:outline-none focus:border-red transition-colors resize-vertical"
                        />
                      ) : field.type === "image" ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateField(activePage, sIdx, key, e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-navy text-[16px] md:text-sm focus:outline-none focus:border-red transition-colors"
                            placeholder="https://example.com/image.jpg"
                          />
                          {field.value && (
                            <div className="relative w-full max-w-[300px] aspect-video rounded-lg overflow-hidden border border-white/10 bg-white/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={field.value}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateField(activePage, sIdx, key, e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-navy text-[16px] md:text-sm focus:outline-none focus:border-red transition-colors"
                        />
                      )}
                    </div>
                  ))}

                  {/* Add field buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => addField(activePage, sIdx, "text")}
                      className="flex items-center gap-1.5 text-navy/40 hover:text-navy text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Type className="w-3 h-3" /> Text
                    </button>
                    <button
                      onClick={() => addField(activePage, sIdx, "textarea")}
                      className="flex items-center gap-1.5 text-navy/40 hover:text-navy text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <AlignLeft className="w-3 h-3" /> Paragraph
                    </button>
                    <button
                      onClick={() => addField(activePage, sIdx, "image")}
                      className="flex items-center gap-1.5 text-navy/40 hover:text-navy text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Image className="w-3 h-3" /> Image
                    </button>
                  </div>

                  {/* List Items */}
                  {section.list && (
                    <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <List className="w-4 h-4 text-red" />
                        <span className="text-navy font-bold text-xs uppercase tracking-wider">
                          {section.list.label} ({section.list.items.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {section.list.items.map((item, iIdx) => (
                          <div
                            key={iIdx}
                            className="bg-white/5 border border-white/10 rounded-lg p-3 md:p-4"
                          >
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                              <span className="text-navy/40 text-xs font-bold uppercase">
                                Item {iIdx + 1}
                              </span>
                              <button
                                onClick={() => removeListItem(activePage, sIdx, iIdx)}
                                className="text-navy/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {section.list!.itemFields.map((fieldName) => (
                                <div key={fieldName}>
                                  <label className="block text-navy/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                                    {fieldName}
                                  </label>
                                  {fieldName === "description" || fieldName === "features" ? (
                                    <textarea
                                      value={item[fieldName] || ""}
                                      onChange={(e) =>
                                        updateListItem(
                                          activePage,
                                          sIdx,
                                          iIdx,
                                          fieldName,
                                          e.target.value
                                        )
                                      }
                                      rows={2}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-navy text-[16px] md:text-sm focus:outline-none focus:border-red transition-colors resize-vertical"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={item[fieldName] || ""}
                                      onChange={(e) =>
                                        updateListItem(
                                          activePage,
                                          sIdx,
                                          iIdx,
                                          fieldName,
                                          e.target.value
                                        )
                                      }
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-navy text-[16px] md:text-sm focus:outline-none focus:border-red transition-colors"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addListItem(activePage, sIdx)}
                        className="flex items-center gap-1.5 text-red hover:text-red-hover text-xs font-bold uppercase tracking-wide mt-3 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add{" "}
                        {section.list.label.replace(/s$/, "")}
                      </button>
                    </div>
                  )}

                  {/* Add list to section */}
                  {!section.list && (
                    <button
                      onClick={() => addListToSection(activePage, sIdx)}
                      className="flex items-center gap-1.5 text-navy/30 hover:text-navy text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <List className="w-3 h-3" /> Add List
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Section */}
      <button
        onClick={() => addSection(activePage)}
        className="flex items-center gap-2 text-navy/40 hover:text-navy text-sm font-bold uppercase tracking-wide mt-4 md:mt-6 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl transition-colors w-full justify-center border border-dashed border-white/10 hover:border-white/20"
      >
        <Plus className="w-4 h-4" /> Add Section to {currentPage.label}
      </button>

      {/* Floating sticky save toolbar — visible when dirty */}
      {dirty && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-1 bg-[#0a0a0f]/95 border border-white/20 rounded-full px-2 py-2 shadow-2xl backdrop-blur-sm">
          <span className="hidden sm:flex items-center gap-1.5 text-amber-400 text-xs font-semibold px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
          <button
            onClick={discard}
            className="flex items-center gap-1.5 text-navy/50 hover:text-navy text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Discard</span>
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
