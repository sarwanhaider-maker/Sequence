import { useNavigate } from "react-router-dom";

export default function BotGame() {
  const navigate = useNavigate();

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100vw",
      height: "100vh",
      background: "#0f0b1e",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999
    }}>
      {/* Thin header bar with back button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "6px 14px",
        background: "rgba(15,11,30,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#b0a9c9",
            padding: "5px 14px",
            borderRadius: "7px",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: "600",
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: "0.5px",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#b0a9c9";
          }}
        >
          ← Back to Lobby
        </button>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: "800",
          fontSize: "0.9rem",
          color: "#7c3aed",
          letterSpacing: "2px",
          textTransform: "uppercase"
        }}>
          🤖 VS BOT
        </span>
        <span style={{
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.35)",
          marginLeft: "auto"
        }}>
          Offline Mode — No server needed
        </span>
      </div>

      {/* Full-screen offline game iframe */}
      <iframe
        src="https://sarwanhaider-maker.github.io/Sequence/sequence_offline.html"
        title="Sequence vs Bot"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          background: "#0f0b1e"
        }}
        allow="autoplay"
      />
    </div>
  );
}
