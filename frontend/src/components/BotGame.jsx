import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function BotGame() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100vw",
      height: "100vh",
      background: "#0f0b1e",
      zIndex: 9999,
      overflow: "hidden"
    }}>

      {/* Full-screen iframe — takes the ENTIRE screen */}
      <iframe
        src="/sequence_offline.html"
        title="Sequence vs Bot"
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%",
          height: "100%",
          border: "none",
          background: "#0f0b1e"
        }}
        allow="autoplay"
      />

      {/* Floating back button — small, top-left corner, above iframe */}
      <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 10000, display: "flex", gap: "6px", alignItems: "center" }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(15,11,30,0.85)",
            border: "1px solid rgba(124,58,237,0.6)",
            color: "#7c3aed",
            fontSize: "1.1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
            transition: "all 0.2s",
            flexShrink: 0
          }}
          title="Menu"
        >
          🤖
        </button>

        {/* Slide-out panel when menu opened */}
        {menuOpen && (
          <div style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            animation: "fadeIn 0.2s ease"
          }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "rgba(15,11,30,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: "700",
                fontFamily: "'Outfit', sans-serif",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap"
              }}
            >
              ← Back to Lobby
            </button>
            <span style={{
              background: "rgba(15,11,30,0.85)",
              border: "1px solid rgba(124,58,237,0.4)",
              color: "#7c3aed",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.72rem",
              fontWeight: "700",
              fontFamily: "'Cinzel', sans-serif",
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap",
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}>
              VS BOT
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
