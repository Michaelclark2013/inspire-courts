"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a1628",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#fff",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "rgba(204,0,0,0.1)",
            border: "1px solid rgba(204,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            fontSize: 28,
          }}
          aria-hidden="true"
        >
          !
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.025em",
            marginBottom: 12,
          }}
        >
          Something Went Wrong
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            maxWidth: 320,
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          We hit an unexpected error. Try refreshing — it usually fixes itself.
        </p>

        {error.digest && (
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 12,
              fontFamily: "monospace",
              marginBottom: 32,
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: error.digest ? 0 : 32 }}>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#cc0000",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "14px 32px",
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Go Home
          </a>
        </div>

        <p
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginTop: 48,
          }}
        >
          Inspire Courts AZ &bull; Gilbert, Arizona
        </p>
      </body>
    </html>
  );
}
