"use client";

import { useState, useEffect } from "react";
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
  Image,
  Type,
  AlignLeft,
  List,
} from "lucide-react";
import type { SiteContent, ContentSection } from "@/lib/content";

export default function ContentEditorPage() {
  const { data: session, status } = useSession();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["0"])
  );

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

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function updateField(
    pageId: string,
    sectionIdx: number,
    fieldKey: string,
    value: string
  ) {
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
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].list!.items[itemIdx][
        fieldKey
      ] = value;
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

  function removeListItem(
    pageId: string,
    sectionIdx: number,
    itemIdx: number
  ) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].list!.items.splice(
        itemIdx,
        1
      );
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

  function addField(
    pageId: string,
    sectionIdx: number,
    type: "text" | "textarea" | "image"
  ) {
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

  function removeField(
    pageId: string,
    sectionIdx: number,
    fieldKey: string
  ) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      delete updated.pages[pageId].sections[sectionIdx].fields[fieldKey];
      return updated;
    });
  }

  function updateFieldLabel(
    pageId: string,
    sectionIdx: number,
    fieldKey: string,
    label: string
  ) {
    setContent((prev) => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev)) as SiteContent;
      updated.pages[pageId].sections[sectionIdx].fields[fieldKey].label = label;
      return updated;
    });
  }

  function updateSectionName(
    pageId: string,
    sectionIdx: number,
    name: string
  ) {
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-[var(--font-chakra)]">
            Content Editor
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Edit all text, images, and content across the website
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-50 text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved!
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

      {/* Page Tabs */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {pageIds.map((id) => (
          <button
            key={id}
            onClick={() => {
              setActivePage(id);
              setExpandedSections(new Set(["0"]));
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
              activePage === id
                ? "bg-red text-white"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
            }`}
          >
            {content.pages[id].label}
          </button>
        ))}
      </div>

      {/* Page Sections */}
      <div className="space-y-4">
        {currentPage.sections.map((section, sIdx) => {
          const sKey = String(sIdx);
          const isExpanded = expandedSections.has(sKey);
          return (
            <div
              key={sIdx}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sKey)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  )}
                  <span className="text-white font-bold text-sm uppercase tracking-wide">
                    {section.name}
                  </span>
                  <span className="text-white/30 text-xs">
                    {Object.keys(section.fields).length} fields
                    {section.list
                      ? ` + ${section.list.items.length} items`
                      : ""}
                  </span>
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-5">
                  {/* Section name editor */}
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <label className="text-white/40 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      Section Name:
                    </label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) =>
                        updateSectionName(activePage, sIdx, e.target.value)
                      }
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red transition-colors flex-1"
                    />
                    <button
                      onClick={() => removeSection(activePage, sIdx)}
                      className="text-white/30 hover:text-red-400 p-1 transition-colors"
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
                          <Image className="w-3.5 h-3.5 text-blue-400" />
                        ) : field.type === "textarea" ? (
                          <AlignLeft className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Type className="w-3.5 h-3.5 text-white/40" />
                        )}
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateFieldLabel(
                              activePage,
                              sIdx,
                              key,
                              e.target.value
                            )
                          }
                          className="bg-transparent text-white/70 text-xs font-bold uppercase tracking-wider focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 pb-0.5"
                        />
                        <button
                          onClick={() => removeField(activePage, sIdx, key)}
                          className="text-white/20 hover:text-red-400 ml-auto transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {field.type === "textarea" ? (
                        <textarea
                          value={field.value}
                          onChange={(e) =>
                            updateField(
                              activePage,
                              sIdx,
                              key,
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red transition-colors resize-vertical"
                        />
                      ) : field.type === "image" ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              updateField(
                                activePage,
                                sIdx,
                                key,
                                e.target.value
                              )
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red transition-colors"
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
                          onChange={(e) =>
                            updateField(
                              activePage,
                              sIdx,
                              key,
                              e.target.value
                            )
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red transition-colors"
                        />
                      )}
                    </div>
                  ))}

                  {/* Add field buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => addField(activePage, sIdx, "text")}
                      className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Type className="w-3 h-3" /> Text
                    </button>
                    <button
                      onClick={() => addField(activePage, sIdx, "textarea")}
                      className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <AlignLeft className="w-3 h-3" /> Paragraph
                    </button>
                    <button
                      onClick={() => addField(activePage, sIdx, "image")}
                      className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Image className="w-3 h-3" /> Image
                    </button>
                  </div>

                  {/* List Items */}
                  {section.list && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <List className="w-4 h-4 text-red" />
                        <span className="text-white font-bold text-xs uppercase tracking-wider">
                          {section.list.label} ({section.list.items.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {section.list.items.map((item, iIdx) => (
                          <div
                            key={iIdx}
                            className="bg-white/5 border border-white/10 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-white/40 text-xs font-bold uppercase">
                                Item {iIdx + 1}
                              </span>
                              <button
                                onClick={() =>
                                  removeListItem(activePage, sIdx, iIdx)
                                }
                                className="text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {section.list!.itemFields.map((fieldName) => (
                                <div key={fieldName}>
                                  <label className="block text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                                    {fieldName}
                                  </label>
                                  {fieldName === "description" ||
                                  fieldName === "features" ? (
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
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red transition-colors resize-vertical"
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
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red transition-colors"
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
                      className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
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
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-bold uppercase tracking-wide mt-6 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl transition-colors w-full justify-center border border-dashed border-white/10 hover:border-white/20"
      >
        <Plus className="w-4 h-4" /> Add Section to{" "}
        {currentPage.label}
      </button>
    </div>
  );
}
