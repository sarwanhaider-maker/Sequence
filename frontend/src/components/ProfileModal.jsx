import React, { useState } from "react";
import { AVATARS } from "./Avatars";

export default function ProfileModal({ isOpen, onClose, profile = { name: "Guest", avatarId: 0, id: "145881", level: 1, coins: 75000 }, onSaveProfile, stats = { gamesPlayed: 1, gamesWon: 1, sequencesMade: 1, winnings: 50000, winStreak: 1 } }) {
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile({ name: newName, avatarId: selectedAvatar });
    setEditMode(false);
  };

  const handleClose = () => {
    setEditMode(false);
    onClose();
  };

  const RenderAvatar = AVATARS[profile.avatarId];

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
        maxWidth: "420px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        position: "relative",
        maxHeight: "92vh",
        overflowY: "auto"
      }}>
        {/* Header with Back button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <button 
            onClick={handleClose}
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
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "2px" }}>
            {editMode ? "EDIT PROFILE" : "PLAYER PROFILE"}
          </h2>
          <div style={{ width: "36px" }}></div>
        </div>

        {!editMode ? (
          /* View Mode */
          <>
            {/* Avatar & Basic Info Card */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "linear-gradient(135deg, #2b1d55 0%, #170d38 100%)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
            }}>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", border: "3px solid #e4ca56", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 10px rgba(228,202,86,0.5)" }}>
                <RenderAvatar />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "white" }}>{profile.name}</span>
                <span style={{ fontSize: "0.85rem", color: "#b0a9c9", fontWeight: "600" }}>ID: {profile.id}</span>
                <span style={{ fontSize: "0.85rem", color: "#10d9d2", fontWeight: "800", textTransform: "uppercase" }}>Lvl {profile.level}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setNewName(profile.name);
                setSelectedAvatar(profile.avatarId);
                setEditMode(true);
              }}
              className="btn-cyan-glow" 
              style={{
                padding: "12px",
                borderRadius: "30px",
                fontWeight: "800",
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer"
              }}
            >
              Edit Profile
            </button>

            {/* Statistics Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px", margin: "6px 0" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.2rem", fontWeight: "900", color: "#ecc94b", letterSpacing: "1.5px" }}>STATISTICS</span>
              </div>

              {[
                { label: "GAMES PLAYED", value: stats.gamesPlayed },
                { label: "GAMES WON", value: stats.gamesWon },
                { label: "SEQUENCES MADE", value: stats.sequencesMade },
                { label: "WINNINGS", value: stats.winnings?.toLocaleString() },
                { label: "WIN STREAK", value: stats.winStreak }
              ].map((stat, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "linear-gradient(90deg, #322168 0%, #1b103e 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "10px 18px",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  <span style={{ color: "#c3bee0", letterSpacing: "0.5px" }}>{stat.label}</span>
                  <span style={{ color: "#ecc94b", fontSize: "0.95rem", fontWeight: "800" }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Edit Profile Mode */
          <>
            {/* Display selected avatar */}
            <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
              <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "4px solid #e4ca56", overflow: "hidden", boxShadow: "0 0 15px rgba(228,202,86,0.6)" }}>
                {React.createElement(AVATARS[selectedAvatar])}
              </div>
            </div>

            {/* Avatar Selection Grid */}
            <div style={{
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "10px"
            }}>
              {AVATARS.map((AvatarComp, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAvatar(idx)}
                  style={{
                    background: "none",
                    border: selectedAvatar === idx ? "2.5px solid #ecc94b" : "1.5px solid rgba(255,255,255,0.15)",
                    borderRadius: "50%",
                    padding: 0,
                    cursor: "pointer",
                    overflow: "hidden",
                    aspectRatio: "1/1",
                    boxShadow: selectedAvatar === idx ? "0 0 8px #ecc94b" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <AvatarComp />
                </button>
              ))}
            </div>

            {/* Name Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#b0a9c9" }}>NAME</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={12}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "white",
                  padding: "10px 14px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  outline: "none"
                }}
              />
            </div>

            {/* Save Button */}
            <button 
              onClick={handleSave}
              className="btn-gold-glow" 
              style={{
                padding: "12px",
                borderRadius: "30px",
                fontWeight: "800",
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              SAVE
            </button>
          </>
        )}
      </div>
    </div>
  );
}
