import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Inspire Courts AZ — Arizona's Premier Indoor Basketball & Volleyball Facility";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0B1D3A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Red radial glow top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at top, rgba(204,0,0,0.18) 0%, transparent 60%)",
          }}
        />
        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#CC0000",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Badge */}
          <div
            style={{
              backgroundColor: "#CC0000",
              color: "white",
              fontSize: 16,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              padding: "10px 28px",
              borderRadius: 50,
              marginBottom: 36,
              display: "flex",
            }}
          >
            EST. GILBERT, AZ
          </div>

          {/* Main title */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "white",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 0.85,
              letterSpacing: "-0.02em",
              marginBottom: 4,
              display: "flex",
            }}
          >
            INSPIRE
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#CC0000",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 0.85,
              letterSpacing: "-0.02em",
              marginBottom: 40,
              display: "flex",
            }}
          >
            COURTS AZ
          </div>

          {/* Divider */}
          <div
            style={{
              width: 80,
              height: 3,
              background: "#CC0000",
              marginBottom: 32,
              display: "flex",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.8)",
              textAlign: "center",
              marginBottom: 16,
              display: "flex",
            }}
          >
            Arizona&apos;s Premier Indoor Basketball Facility
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {["7 Courts", "52,000 Sq Ft", "Game Film Available", "Gilbert, AZ"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 15,
                    fontWeight: 600,
                    padding: "8px 20px",
                    borderRadius: 50,
                    display: "flex",
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
