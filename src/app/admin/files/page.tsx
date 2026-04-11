import { FolderOpen, ExternalLink, FileSpreadsheet, FileText, Image, File, Folder } from "lucide-react";
import {
  listDriveFolder,
  isGoogleConfigured,
  DRIVE_FOLDERS,
  MIME_LABELS,
  type DriveFile,
} from "@/lib/google-sheets";
import FilesClient from "@/components/admin/FilesClient";

export const revalidate = 300;

function formatSize(bytes?: string): string {
  if (!bytes) return "";
  const n = parseInt(bytes);
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Key folders and sheets to highlight
const QUICK_LINKS = [
  {
    name: "Game Scores (Responses)",
    url: `https://docs.google.com/spreadsheets/d/1djRRsPTqFccTjeZtd9MlJUUrTWLFCGqiIay-M9aJt1U`,
    type: "Spreadsheet",
  },
  {
    name: "Master Teams / Payments",
    url: `https://docs.google.com/spreadsheets/d/18qzNu38vhGrwDcYeATg_N8UaUjoc-37xmwdvrsQIP3M`,
    type: "Spreadsheet",
  },
  {
    name: "Mom Money",
    url: `https://docs.google.com/spreadsheets/d/1_uPRO-PCiXUaTNOXrxGlti3eDJMedVrAj66b9rcyZiU`,
    type: "Spreadsheet",
  },
  {
    name: "Player Check-In (Responses)",
    url: `https://docs.google.com/spreadsheets/d/1Ht-kbwp2myNH89QVXjF0YidHLwU0z1nrnzF6LVpxoP0`,
    type: "Spreadsheet",
  },
  {
    name: "Staff Check-Out (Responses)",
    url: `https://docs.google.com/spreadsheets/d/1lzJreIHQm1-UpnJx17idGOun2wxlW379y3xQQhxeWVo`,
    type: "Spreadsheet",
  },
  {
    name: "Ref Check-Out (Responses)",
    url: `https://docs.google.com/spreadsheets/d/17LRniZAkihHY2jtWrmcWTwztSr7W_daflYQ_8Q2cRGs`,
    type: "Spreadsheet",
  },
  {
    name: "Team Prospect Pipeline",
    url: `https://docs.google.com/spreadsheets/d/1xL2mx8HJYUybhmctE7gXGD-4xktUhe4fsp9p9_qvCXg`,
    type: "Spreadsheet",
  },
  {
    name: "Inspire Club 2026",
    url: `https://docs.google.com/spreadsheets/d/1wBHxjhst1F71z9cOwAjyjEPfHSR1MwAH8miWVbOj46o`,
    type: "Spreadsheet",
  },
];

export default async function FilesPage() {
  // Always show the quick links panel regardless of auth
  // Try to load Drive files if Google is configured
  let rootFiles: DriveFile[] = [];
  let responsesFiles: DriveFile[] = [];

  if (isGoogleConfigured()) {
    [rootFiles, responsesFiles] = await Promise.all([
      listDriveFolder(DRIVE_FOLDERS.root),
      listDriveFolder(DRIVE_FOLDERS.responses),
    ]);
  }

  const enrichFiles = (files: DriveFile[]) =>
    files.map((f) => ({
      ...f,
      typeLabel: MIME_LABELS[f.mimeType] || "File",
      modifiedFormatted: formatDate(f.modifiedTime),
      sizeFormatted: formatSize(f.size),
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
    }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
          Files
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Google Drive — Inspire / Off Season Event Operations
        </p>
      </div>

      {/* Quick Links — always visible */}
      <div className="bg-bg-secondary border border-border rounded-sm mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-accent" />
          <h2 className="text-white font-bold text-sm uppercase tracking-tight">
            Key Spreadsheets
          </h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-bg border border-border rounded-sm hover:border-accent/50 hover:bg-accent/5 transition-colors group"
            >
              <div className="w-8 h-8 bg-success/10 rounded flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate group-hover:text-accent transition-colors">
                  {link.name}
                </p>
                <p className="text-text-secondary text-[10px]">{link.type}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-text-secondary flex-shrink-0 group-hover:text-accent transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Drive browser */}
      {!isGoogleConfigured() ? (
        <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center">
          <FolderOpen className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">
            Connect Google Drive
          </p>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local to browse your Drive folders.
          </p>
          <p className="text-text-secondary text-xs mt-3">
            The key spreadsheet links above will always work — click any to open in Google Sheets.
          </p>
        </div>
      ) : (
        <FilesClient
          rootFiles={enrichFiles(rootFiles)}
          responsesFiles={enrichFiles(responsesFiles)}
        />
      )}
    </div>
  );
}
