import React, { useState } from "react";
import { CoinIcon } from "./Avatars";

const REWARDS = [
  { day: 1, amount: 100 },
  { day: 2, amount: 250 },
  { day: 3, amount: 500 },
  { day: 4, amount: 1000 },
  { day: 5, amount: 2500 },
  { day: 6, fillText: "5K", amount: 5000 },
  { day: 7, fillText: "10K", amount: 10000 }
];

export default function DailyBonus({ claimedDays = {}, lastClaimTime = 0, onClaim }) {
  const [claimPopup, setClaimPopup] = useState(null); // amount claimed

  // Determine which day is current
  // For simplicity: count how many days have been claimed. Next day is current (if not already claimed within last 24h)
  const totalClaimedCount = Object.keys(claimedDays).length;
  const currentClaimDay = totalClaimedCount + 1 <= 7 ? totalClaimedCount + 1 : 1;

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const canClaim = !lastClaimTime || (now - lastClaimTime) >= ONE_DAY;

  const handleClaimDay = (dayObj) => {
    if (dayObj.day !== currentClaimDay || !canClaim) return;
    onClaim(dayObj.amount);
    setClaimPopup(dayObj.amount);
  };

  return (
    <div style={{
      width: "100%",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      animation: "fadeIn 0.35s ease-out"
    }}>
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.6rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "2.5px" }}>DAILY BONUS</h2>
        <p style={{ color: "#b0a9c9", fontSize: "0.85rem", fontWeight: "600", margin: "4px 0 0 0" }}>
          {canClaim ? "Claim your free daily rewards!" : "Come back tomorrow for your next reward!"}
        </p>
      </div>

      {/* Grid of days */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "14px"
      }}>
        {REWARDS.map((reward) => {
          const isClaimed = !!claimedDays[reward.day];
          const isCurrent = reward.day === currentClaimDay;
          const isClickable = isCurrent && canClaim;

          // Days 7 takes double width
          const isLastDay = reward.day === 7;

          return (
            <div
              key={reward.day}
              onClick={() => isClickable && handleClaimDay(reward)}
              style={{
                gridColumn: isLastDay ? "span 2" : "span 1",
                background: isClaimed 
                  ? "rgba(16, 217, 210, 0.05)" 
                  : isCurrent 
                    ? "linear-gradient(135deg, #1c3d6e 0%, #0c1c3f 100%)" 
                    : "linear-gradient(135deg, #2b1d55 0%, #150d36 100%)",
                border: isClaimed
                  ? "2px solid rgba(16, 217, 210, 0.4)"
                  : isCurrent
                    ? "2px solid #10d9d2"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: isLastDay ? "16px 24px" : "14px",
                display: "flex",
                flexDirection: isLastDay ? "row" : "column",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                cursor: isClickable ? "pointer" : "default",
                boxShadow: isCurrent ? "0 0 15px rgba(16, 217, 210, 0.25)" : "none",
                transform: isCurrent ? "scale(1.02)" : "none",
                transition: "all 0.25s ease",
                position: "relative"
              }}
            >
              {/* Day Badge */}
              <div style={{
                fontSize: "0.85rem",
                fontWeight: "800",
                color: isClaimed ? "#10d9d2" : isCurrent ? "#ecc94b" : "#c3bee0",
                textTransform: "uppercase"
              }}>
                Day {reward.day}
              </div>

              {/* Gift / Coin Visual */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  fontSize: isLastDay ? "2rem" : "1.8rem",
                  filter: isClaimed ? "grayscale(80%) opacity(0.6)" : "none"
                }}>
                  🎁
                </div>
                {isLastDay && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <CoinIcon className="w-5 h-5" />
                    <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#e4ca56" }}>10,000</span>
                  </div>
                )}
              </div>

              {/* Reward text / claimed status */}
              {!isLastDay && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <CoinIcon className="w-4 h-4" />
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: isCurrent ? "white" : "#e2e8f0" }}>
                    {reward.fillText || reward.amount}
                  </span>
                </div>
              )}

              {/* Status Indicators */}
              {isClaimed ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#10d9d2",
                  background: "rgba(16, 217, 210, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "10px"
                }}>
                  ✓ CLAIMED
                </div>
              ) : isClickable ? (
                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#0c0821",
                  background: "linear-gradient(135deg, #ecc94b, #d69e2e)",
                  padding: "4px 10px",
                  borderRadius: "10px",
                  animation: "pulse 1s infinite alternate"
                }}>
                  TAP TO CLAIM
                </div>
              ) : (
                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#718096",
                  background: "rgba(255,255,255,0.05)",
                  padding: "2px 8px",
                  borderRadius: "10px"
                }}>
                  LOCKED
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Claimed Modal Alert Overlay */}
      {claimPopup && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div className="glass-panel" style={{
            width: "80%",
            maxWidth: "320px",
            padding: "24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            border: "2px solid #10d9d2"
          }}>
            <div style={{ fontSize: "3rem", animation: "scaleIn 0.4s ease-out" }}>🎉</div>
            <h3 style={{ fontFamily: "'Cinzel', serif", color: "#ecc94b", margin: 0, fontSize: "1.25rem", fontWeight: "900" }}>Bonus Claimed</h3>
            <p style={{ color: "#e2e8f0", fontSize: "0.95rem", margin: 0, fontWeight: "600" }}>
              You received {claimPopup.toLocaleString()} coins.
            </p>
            <button
              onClick={() => setClaimPopup(null)}
              className="btn-cyan-glow"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "20px",
                border: "none",
                fontWeight: "800",
                cursor: "pointer",
                marginTop: "6px"
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
