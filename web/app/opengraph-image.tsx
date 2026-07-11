import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AnimAI — production-safe 3D & motion for AI agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #020617 0%, #0c1a3a 40%, #1e1b4b 70%, #020617 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#38bdf8",
            }}
          />
          <span style={{ fontSize: "32px", fontWeight: 600, color: "#e2e8f0" }}>AnimAI</span>
        </div>
        <div style={{ fontSize: "56px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, maxWidth: "900px" }}>
          Production-safe 3D &amp; motion components your AI agent can install.
        </div>
        <div style={{ fontSize: "24px", color: "#94a3b8", marginTop: "24px" }}>
          Vetted &bull; Leak-free &bull; SSR-safe &bull; CLI &amp; MCP
        </div>
      </div>
    ),
    { ...size },
  );
}
