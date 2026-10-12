import { ImageResponse } from "next/og";

import { OG_SIZE } from "./og-constants";

/** Dynamic social card rendered via @vercel/og / next/og. */
export function renderOgImage(
  title: string = "Free Developer Tools: Time, JSON, Encoding",
  subtitle: string = "Fast, privacy-friendly utilities running directly in your browser.",
  tag: string = "CASTOV TOOLS"
) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "#080C16",
          color: "#F3F4F6",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient glow in background */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(37, 99, 235, 0.2)",
            filter: "blur(90px)",
          }}
        />

        {/* Top Header: Logo & Tag */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 800,
                color: "#FFFFFF",
                boxShadow: "0 10px 25px rgba(37,99,235,0.4)",
              }}
            >
              C
            </div>
            <div style={{ marginLeft: 20, fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Castov
            </div>
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(37, 99, 235, 0.15)",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              color: "#60A5FA",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {tag.toUpperCase()}
          </div>
        </div>

        {/* Middle Body: Main Title & Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 10 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 30,
              color: "#94A3B8",
              lineHeight: 1.4,
              maxWidth: "950px",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Footer info: URL & Privacy badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 24,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 26, color: "#60A5FA", fontWeight: 600 }}>
            castov.com
          </div>
          <div style={{ fontSize: 24, color: "#64748B", fontWeight: 500 }}>
            Zero Telemetry • Client-Side
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
