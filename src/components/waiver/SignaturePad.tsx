"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Eraser } from "lucide-react";

export type SignaturePadHandle = {
  clear: () => void;
  toDataUrl: () => string | null;
  isEmpty: () => boolean;
};

// Touch + mouse-capable canvas signature pad. Zero deps, inline data
// URL out. Scales for hi-DPI so strokes stay crisp on tablets.
export const SignaturePad = forwardRef<SignaturePadHandle, { height?: number }>(
  function SignaturePad({ height = 180 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const lastRef = useRef<{ x: number; y: number } | null>(null);
    const [hasInk, setHasInk] = useState(false);

    // Set up canvas with devicePixelRatio scaling so strokes stay
    // sharp on 2x/3x displays. Re-runs on resize.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#0B1D3A"; // navy
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, w, h);
        }
      };
      scale();
      window.addEventListener("resize", scale);
      return () => window.removeEventListener("resize", scale);
    }, []);

    function coordFrom(e: PointerEvent | React.PointerEvent): { x: number; y: number } {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function start(e: React.PointerEvent) {
      e.preventDefault();
      drawingRef.current = true;
      const pt = coordFrom(e);
      lastRef.current = pt;
      setHasInk(true);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    function move(e: React.PointerEvent) {
      if (!drawingRef.current) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !lastRef.current) return;
      const pt = coordFrom(e);
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      lastRef.current = pt;
    }

    function end() {
      drawingRef.current = false;
      lastRef.current = null;
    }

    function clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      setHasInk(false);
    }

    useImperativeHandle(ref, () => ({
      clear,
      toDataUrl: () => {
        if (!hasInk) return null;
        return canvasRef.current?.toDataURL("image/png") ?? null;
      },
      isEmpty: () => !hasInk,
    }));

    return (
      <div className="relative border-2 border-dashed border-border rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          style={{ height, touchAction: "none" }}
          className="w-full rounded-lg cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          aria-label="Signature canvas — sign with mouse or finger"
        />
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-text-secondary text-sm">
            Sign here
          </div>
        )}
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-red bg-white border border-border rounded px-2 py-1"
        >
          <Eraser className="w-3 h-3" /> Clear
        </button>
      </div>
    );
  }
);
