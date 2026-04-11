"use client";

import { useState } from "react";
import {
  FolderOpen,
  FileSpreadsheet,
  FileText,
  Image,
  File,
  Folder,
  ExternalLink,
  Clock,
} from "lucide-react";

interface EnrichedFile {
  id: string;
  name: string;
  mimeType: string;
  typeLabel: string;
  modifiedFormatted: string;
  sizeFormatted: string;
  webViewLink: string;
  isFolder: boolean;
}

interface Props {
  rootFiles: EnrichedFile[];
  responsesFiles: EnrichedFile[];
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/vnd.google-apps.folder")
    return <Folder className="w-4 h-4 text-yellow-400" />;
  if (mimeType === "application/vnd.google-apps.spreadsheet")
    return <FileSpreadsheet className="w-4 h-4 text-success" />;
  if (mimeType === "application/vnd.google-apps.document")
    return <FileText className="w-4 h-4 text-blue-400" />;
  if (mimeType.startsWith("image/"))
    return <Image className="w-4 h-4 text-purple-400" />;
  return <File className="w-4 h-4 text-text-secondary" />;
}

function FileGrid({ files }: { files: EnrichedFile[] }) {
  if (files.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary text-sm">
        No files found in this folder. Make sure the folder is shared with your
        service account.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {files.map((file) => (
        <a
          key={file.id}
          href={file.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 hover:bg-bg/50 transition-colors group"
        >
          <div className="w-8 h-8 bg-bg rounded flex items-center justify-center flex-shrink-0">
            <FileIcon mimeType={file.mimeType} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate group-hover:text-accent transition-colors">
              {file.name}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-text-secondary text-xs">{file.typeLabel}</span>
              {file.sizeFormatted && (
                <span className="text-text-secondary text-xs">{file.sizeFormatted}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1 text-text-secondary text-xs">
              <Clock className="w-3 h-3" />
              {file.modifiedFormatted}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent transition-colors" />
          </div>
        </a>
      ))}
    </div>
  );
}

export default function FilesClient({ rootFiles, responsesFiles }: Props) {
  const [activeTab, setActiveTab] = useState<"root" | "responses">("root");

  const folders = rootFiles.filter((f) => f.isFolder);
  const files = rootFiles.filter((f) => !f.isFolder);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary border border-border rounded-sm p-1 w-fit">
        <button
          onClick={() => setActiveTab("root")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "root"
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-white"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Main Folder ({rootFiles.length})
        </button>
        <button
          onClick={() => setActiveTab("responses")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "responses"
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-white"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Responses ({responsesFiles.length})
        </button>
      </div>

      {/* File list */}
      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-text-secondary text-xs">
            {activeTab === "root"
              ? "Inspire / Off Szn Event Operations etc"
              : "Responses subfolder"}{" "}
            — {activeTab === "root" ? rootFiles.length : responsesFiles.length} items
          </p>
        </div>
        <FileGrid files={activeTab === "root" ? rootFiles : responsesFiles} />
      </div>

      {/* Stats */}
      {activeTab === "root" && folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Folders", value: folders.length },
            { label: "Files", value: files.length },
            {
              label: "Spreadsheets",
              value: rootFiles.filter(
                (f) => f.mimeType === "application/vnd.google-apps.spreadsheet"
              ).length,
            },
            {
              label: "Documents",
              value: rootFiles.filter(
                (f) => f.mimeType === "application/vnd.google-apps.document"
              ).length,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-bg-secondary border border-border rounded-sm p-3 text-center"
            >
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-text-secondary text-xs uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
