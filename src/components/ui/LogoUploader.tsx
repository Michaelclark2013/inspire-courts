"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Upload, X, Check, Loader2, ImageIcon } from "lucide-react";

interface LogoUploaderProps {
  teamName: string;
  currentLogoUrl?: string | null;
  onSuccess?: (url: string) => void;
  /** "button" = icon button, "card" = full card with current logo preview */
  variant?: "button" | "card";
}

export default function LogoUploader({
  teamName,
  currentLogoUrl,
  onSuccess,
  variant = "button",
}: LogoUploaderProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPreview(null);
    setFile(null);
    setError("");
    setSuccess(false);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  const handleFile = useCallback((f: File) => {
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setError("Only PNG, JPG, or WebP images allowed");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ""; // allow re-selecting same file
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("teamName", teamName);
      fd.append("file", file);
      const res = await fetch("/api/teams/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSuccess(true);
      onSuccess?.(data.url);
      setTimeout(handleClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const trigger = variant === "card" ? (
    <button
      onClick={() => setOpen(true)}
      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-navy/30 rounded-2xl py-8 transition-colors group"
    >
      {currentLogoUrl ? (
        <Image src={currentLogoUrl} alt={teamName} width={64} height={64} className="w-16 h-16 object-contain rounded-full mb-1" unoptimized />
      ) : (
        <div className="w-16 h-16 bg-light-gray rounded-full flex items-center justify-center mb-1">
          <ImageIcon className="w-7 h-7 text-text-muted" />
        </div>
      )}
      <span className="text-text-secondary text-xs font-semibold group-hover:text-navy transition-colors">
        {currentLogoUrl ? "Change logo" : "Upload team logo"}
      </span>
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      title="Upload team logo"
      className="w-7 h-7 flex items-center justify-center rounded-full bg-off-white hover:bg-light-gray transition-colors flex-shrink-0"
    >
      <Camera className="w-3.5 h-3.5 text-text-secondary" />
    </button>
  );

  return (
    <>
      {trigger}

      {/* Modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-full max-w-sm mx-auto px-4">
            <div className="bg-bg-secondary border border-white/[0.1] rounded-2xl p-5 shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">Team Logo</h3>
                  <p className="text-text-secondary text-xs mt-0.5 truncate max-w-[200px]">{teamName}</p>
                </div>
                <button onClick={handleClose} aria-label="Close" className="text-text-secondary hover:text-white transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              {preview ? (
                <div className="relative mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded-xl bg-black/30"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Upload options */
                <div className="space-y-2 mb-4">
                  {/* Gallery / file picker */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-3.5 transition-colors"
                  >
                    <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4 text-accent" aria-hidden="true" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-semibold">Choose from library</p>
                      <p className="text-text-secondary text-xs">PNG, JPG, or WebP · max 2 MB</p>
                    </div>
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleInputChange} />

                  {/* Camera (mobile) */}
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="w-full flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-3.5 transition-colors"
                  >
                    <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-semibold">Take a photo</p>
                      <p className="text-text-secondary text-xs">Use your camera</p>
                    </div>
                  </button>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />

                  {/* Current logo if exists */}
                  {currentLogoUrl && (
                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                      <Image src={currentLogoUrl} alt="current" width={32} height={32} className="w-8 h-8 object-contain rounded-full" unoptimized />
                      <p className="text-text-secondary text-xs">Current logo — upload a new one to replace</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <p role="alert" aria-live="assertive" className="text-red text-xs mb-3 bg-red/10 border border-red/20 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Actions */}
              {preview && !success && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-wider transition-colors"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Uploading…</>
                  ) : (
                    <><Upload className="w-4 h-4" aria-hidden="true" /> Upload Logo</>
                  )}
                </button>
              )}

              {success && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 py-2">
                  <Check className="w-5 h-5" aria-hidden="true" />
                  <span className="font-semibold text-sm">Logo updated!</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
