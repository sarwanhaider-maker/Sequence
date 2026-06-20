import React, { useState } from "react";
import { CoinIcon } from "./Avatars";
import Swal from "sweetalert2";

const STAKES = [
  { id: 1, name: "One Vs One", reward: 100, fee: 50, time: 60, seq: 2, board: "STANDARD" },
  { id: 2, name: "One Vs One", reward: 200, fee: 100, time: 60, seq: 2, board: "SHUFFLED" },
  { id: 3, name: "One Vs One", reward: 1000, fee: 500, time: 45, seq: 2, board: "STANDARD" },
  { id: 4, name: "One Vs One Vs One", reward: 10000, fee: 5000, time: 45, seq: 1, board: "STANDARD" }
];

export default function StakesCarousel({ coins, onSelectStake, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % STAKES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + STAKES.length) % STAKES.length);
  };

  const handlePlay = () => {
    const stake = STAKES[currentIndex];
    if (coins < stake.fee) {
      Swal.fire({
        title: "Insufficient Coins",
        text: `You need at least ${stake.fee} coins to enter this match. Go to the Store to get more!`,
        icon: "warning",
        confirmButtonText: "Okay",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)",
        iconColor: 'var(--accent-gold)'
      });
      return;
    }
    // Deduct coins and play
    onSelectStake(stake);
  };

  const activeStake = STAKES[currentIndex];

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "18px",
      animation: "fadeIn 0.35s ease-out",
      position: "relative"
    }}>
      {/* Header ribbon */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0 8px"
      }}>
        <button 
          onClick={onBack}
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
            fontWeight: "bold",
            zIndex: 10
          }}
        >
          ←
        </button>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.5rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "2px" }}>PLAY ONLINE</h2>
        <div style={{ width: "36px" }}></div>
      </div>

      {/* Stakes Card Container */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        gap: "12px",
        marginTop: "10px"
      }}>
        {/* Left Arrow */}
        <button 
          onClick={handlePrev}
          style={{
            background: "rgba(124, 58, 237, 0.2)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            color: "#10d9d2",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "1.2rem",
            fontWeight: "900",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          ‹
        </button>

        {/* Stakes Card Detail */}
        <div style={{
          width: "240px",
          background: "linear-gradient(135deg, #322168 0%, #150a32 100%)",
          border: "2.5px solid #10d9d2",
          borderRadius: "20px",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          boxShadow: "0 10px 30px rgba(16, 217, 210, 0.25)",
          position: "relative"
        }}>
          {/* Room Name ribbon */}
          <div style={{
            background: "linear-gradient(90deg, #4c1d95, #7c3aed)",
            border: "1px solid rgba(16, 217, 210, 0.5)",
            borderRadius: "20px",
            padding: "4px 18px",
            fontSize: "0.85rem",
            fontWeight: "800",
            color: "white",
            position: "absolute",
            top: "-14px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap"
          }}>
            {activeStake.name}
          </div>

          {/* Reward Capsule */}
          <div style={{
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            width: "100%",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            marginTop: "8px"
          }}>
            <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#b0a9c9", letterSpacing: "1px" }}>REWARD</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CoinIcon className="w-6 h-6" />
              <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#ecc94b" }}>
                {activeStake.reward.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Sub Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
            {/* Turn time */}
            <div style={{
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: "12px",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px"
            }}>
              <span style={{ fontSize: "0.58rem", fontWeight: "700", color: "#b0a9c9" }}>TIME PER TURN</span>
              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#e2e8f0" }}>⏳ {activeStake.time} sec</span>
            </div>

            {/* Sequences */}
            <div style={{
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: "12px",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px"
            }}>
              <span style={{ fontSize: "0.58rem", fontWeight: "700", color: "#b0a9c9" }}>SEQUENCES</span>
              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#ecc94b" }}># {activeStake.seq}</span>
            </div>
          </div>

          {/* Board type */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "0.75rem",
            fontWeight: "700",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: "6px"
          }}>
            <span style={{ color: "#b0a9c9" }}>BOARD TYPE :</span>
            <span style={{ color: "#10d9d2", fontWeight: "800" }}>{activeStake.board}</span>
          </div>

          {/* Entry Fee */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "0.75rem",
            fontWeight: "700"
          }}>
            <span style={{ color: "#b0a9c9" }}>ENTRY FEE :</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CoinIcon className="w-4 h-4" />
              <span style={{ color: "#ecc94b", fontWeight: "800" }}>{activeStake.fee}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handlePlay}
            className="btn-gold-glow"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "20px",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "800",
              cursor: "pointer",
              marginTop: "4px"
            }}
          >
            PLAY
          </button>
        </div>

        {/* Right Arrow */}
        <button 
          onClick={handleNext}
          style={{
            background: "rgba(124, 58, 237, 0.2)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            color: "#10d9d2",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "1.2rem",
            fontWeight: "900",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
