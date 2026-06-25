import React, { useState } from "react";

const BOOSTER_DETAILS = [
  {
    key: "reroll",
    name: "Card Redraw",
    desc: "Swap any card in your hand with a random card from the remaining deck.",
    icon: "🔄"
  },
  {
    key: "emp",
    name: "Shield Breaker",
    desc: "Remove the Chip Guard protection shield from an opponent's chip on the board.",
    icon: "⚡"
  },
  {
    key: "shield",
    name: "Chip Guard",
    desc: "Shield one of your chips on the board from being removed by opponent's Jacks.",
    icon: "🛡️"
  },
  {
    key: "wildUpgrade",
    name: "Wild Upgrade",
    desc: "Temporarily turn one of your hand cards into a Two-Eyed Jack (Wild Card) for this turn.",
    icon: "🃏"
  },
  {
    key: "handExchange",
    name: "Hand Exchange",
    desc: "Swap one of your hand cards with a random card from your opponent's hand.",
    icon: "🔀"
  },
  {
    key: "spy",
    name: "Spying Glass",
    desc: "Spy on your opponent's cards in their hand for 3 seconds during your turn.",
    icon: "🔍"
  }
];

export default function ActiveDockModal({
  isOpen,
  onClose,
  boosters = {},
  activeDock = [],
  onSaveActiveDock
}) {
  const [selected, setSelected] = useState(activeDock);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    if (selected.includes(key)) {
      setSelected(selected.filter(k => k !== key));
    } else {
      if (selected.length >= 2) {
        setSelected([selected[1], key]);
      } else {
        setSelected([...selected, key]);
      }
    }
  };

  const handleConfirm = () => {
    if (selected.length !== 2) {
      alert("Please select exactly 2 tactic cards to complete your dock.");
      return;
    }
    onSaveActiveDock(selected);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10, 7, 26, 0.85)",
      backdropFilter: "blur(12px)",
      zIndex: 9995,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.25s ease-out"
    }}>
      <div className="glass-panel" style={{
        width: "90%",
        maxWidth: "420px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        position: "relative",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "1.5px" }}>TACTIC DOCK</h2>
          <div style={{ width: "36px" }}></div>
        </div>

        <p style={{ margin: 0, fontSize: "0.82rem", color: "#b0a9c9", textAlign: "center", lineHeight: "1.4" }}>
          Choose exactly <strong>2 tactic cards</strong> to carry into the match.
        </p>

        {/* Selected Slots Preview */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.25)",
          padding: "12px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          {[0, 1].map(index => {
            const key = selected[index];
            const detail = key ? BOOSTER_DETAILS.find(d => d.key === key) : null;
            return (
              <div 
                key={index}
                style={{
                  flex: 1,
                  height: "70px",
                  borderRadius: "10px",
                  border: detail ? "1px solid var(--accent-cyan)" : "1px dashed rgba(255,255,255,0.2)",
                  background: detail ? "linear-gradient(135deg, #2c1e57 0%, #150d38 100%)" : "rgba(255,255,255,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  boxShadow: detail ? "0 0 10px rgba(16, 217, 210, 0.2)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                {detail ? (
                  <>
                    <span style={{ fontSize: "1.5rem" }}>{detail.icon}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#e2e8f0" }}>{detail.name}</span>
                  </>
                ) : (
                  <span style={{ fontSize: "0.72rem", color: "#718096" }}>Slot {index + 1} Empty</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Booster List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {BOOSTER_DETAILS.map((booster) => {
            const isEquipped = selected.includes(booster.key);
            const count = boosters[booster.key] || 0;
            return (
              <div
                key={booster.key}
                onClick={() => handleToggle(booster.key)}
                style={{
                  background: isEquipped 
                    ? "linear-gradient(135deg, #32226a 0%, #150d38 100%)" 
                    : "linear-gradient(135deg, #1e153e 0%, #0d0825 100%)",
                  border: isEquipped 
                    ? "1px solid var(--accent-cyan)" 
                    : "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "14px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  boxShadow: isEquipped ? "0 4px 12px rgba(16, 217, 210, 0.15)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ fontSize: "1.8rem" }}>{booster.icon}</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#f8fafc" }}>{booster.name}</span>
                    <span style={{ 
                      fontSize: "0.68rem", 
                      fontWeight: "700", 
                      color: count > 0 ? "var(--accent-gold)" : "#718096",
                      background: "rgba(0,0,0,0.2)",
                      padding: "2px 6px",
                      borderRadius: "8px"
                    }}>
                      Owned: {count}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#b0a9c9", lineHeight: "1.2", textAlign: "left" }}>{booster.desc}</span>
                </div>
                
                {/* Checkbox indicator */}
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: isEquipped ? "2px solid var(--accent-cyan)" : "2px solid rgba(255, 255, 255, 0.3)",
                  background: isEquipped ? "var(--accent-cyan)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  color: "#0c0821",
                  fontWeight: "bold",
                  transition: "all 0.2s ease"
                }}>
                  {isEquipped && "✓"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={selected.length !== 2}
          className="btn-cyan-glow"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "15px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: "900",
            cursor: "pointer",
            marginTop: "6px",
            opacity: selected.length === 2 ? 1 : 0.5
          }}
        >
          Confirm Loadout
        </button>
      </div>
    </div>
  );
}
