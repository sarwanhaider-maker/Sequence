import React from "react";

export default function SettingsModal({ isOpen, onClose, settings = { music: true, sound: true, vibration: true }, onToggleSetting, onQuit }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10, 7, 26, 0.85)",
      backdropFilter: "blur(12px)",
      zIndex: 9990,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.25s ease-out"
    }}>
      <div className="glass-panel" style={{
        width: "90%",
        maxWidth: "400px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        {/* Header with Back button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <button 
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: "bold"
            }}
          >
            ←
          </button>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.5rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "2px" }}>SETTINGS</h2>
          <div style={{ width: "36px" }}></div> {/* Spacer */}
        </div>

        {/* Toggles */}
        {["music", "sound", "vibration"].map((key) => {
          const isActive = settings[key];
          return (
            <div key={key} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(90deg, #4c1d95 0%, #31105e 100%)",
              border: "1px solid rgba(124, 58, 237, 0.4)",
              borderRadius: "30px",
              padding: "10px 20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
            }}>
              <span style={{ fontSize: "1rem", fontWeight: "700", textTransform: "capitalize", color: "#e2e8f0" }}>{key}</span>
              <button 
                onClick={() => onToggleSetting(key)}
                style={{
                  width: "56px",
                  height: "28px",
                  borderRadius: "14px",
                  background: isActive ? "linear-gradient(90deg, #10d9d2, #05b1ac)" : "rgba(255,255,255,0.15)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.3s ease",
                  padding: 0
                }}
              >
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isActive ? "#ecc94b" : "#cbd5e0",
                  position: "absolute",
                  top: "2px",
                  left: isActive ? "30px" : "2px",
                  transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s"
                }} />
              </button>
            </div>
          );
        })}

        {/* Theme Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", marginBottom: "4px" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: "800", color: "#b0a9c9", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
            Select Theme
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "classic", label: "Classic", color: "#1a123a", border: "#10d9d2" },
              { id: "aurora", label: "Aurora 🌌", color: "#0d2830", border: "#10d9d2" },
              { id: "cosmos", label: "Cosmos ✨", color: "#050212", border: "#e4ca56" }
            ].map(t => {
              const isActive = (settings.theme || "classic") === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onToggleSetting("theme", t.id)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    borderRadius: "15px",
                    background: t.color,
                    border: isActive ? `2px solid ${t.border}` : "2px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    boxShadow: isActive ? `0 0 12px ${t.border}` : "none",
                    transition: "all 0.25s ease"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Support, Tutorial, etc. */}
        <button style={{
          background: "linear-gradient(90deg, #4c1d95 0%, #31105e 100%)",
          border: "1px solid rgba(124, 58, 237, 0.4)",
          color: "white",
          padding: "12px",
          borderRadius: "30px",
          fontWeight: "800",
          fontSize: "0.95rem",
          cursor: "pointer"
        }}>
          Support
        </button>

        <button style={{
          background: "linear-gradient(90deg, #4c1d95 0%, #31105e 100%)",
          border: "1px solid rgba(124, 58, 237, 0.4)",
          color: "white",
          padding: "12px",
          borderRadius: "30px",
          fontWeight: "800",
          fontSize: "0.95rem",
          cursor: "pointer"
        }}>
          Tutorial
        </button>

        <button style={{
          background: "linear-gradient(90deg, #4c1d95 0%, #31105e 100%)",
          border: "1px solid rgba(124, 58, 237, 0.4)",
          color: "white",
          padding: "12px",
          borderRadius: "30px",
          fontWeight: "800",
          fontSize: "0.95rem",
          cursor: "pointer"
        }}>
          Terms & Conditions
        </button>

        <button style={{
          background: "linear-gradient(90deg, #4c1d95 0%, #31105e 100%)",
          border: "1px solid rgba(124, 58, 237, 0.4)",
          color: "white",
          padding: "12px",
          borderRadius: "30px",
          fontWeight: "800",
          fontSize: "0.95rem",
          cursor: "pointer"
        }}>
          Privacy Policy
        </button>

        <button className="btn-cyan-glow" style={{
          padding: "12px",
          borderRadius: "30px",
          fontWeight: "800",
          fontSize: "0.95rem",
          cursor: "pointer",
          border: "none",
          marginTop: "4px"
        }}>
          Cloud Backup / Restore
        </button>

        <button className="btn-gold-glow" style={{
          padding: "12px",
          borderRadius: "30px",
          fontWeight: "800",
          fontSize: "0.95rem",
          cursor: "pointer",
          border: "none"
        }}>
          Rate Us
        </button>

        <button 
          onClick={onQuit}
          style={{
            background: "linear-gradient(135deg, #e53e3e 0%, #9b1c1c 100%)",
            color: "white",
            padding: "12px",
            borderRadius: "30px",
            fontWeight: "800",
            fontSize: "0.95rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(229, 62, 62, 0.3)"
          }}
        >
          Quit Game
        </button>
      </div>
    </div>
  );
}
