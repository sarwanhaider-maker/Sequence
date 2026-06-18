import React from "react";
import { AVATARS, CoinIcon, SettingsIcon, ChatIcon } from "./Avatars";

export default function LobbyHeader({ profile = { name: "Guest", avatarId: 0, id: "145881", level: 1, coins: 75000 }, onAvatarClick, onSettingsClick, onChatClick }) {
  const AvatarComp = AVATARS[profile.avatarId];

  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      background: "linear-gradient(180deg, rgba(20, 10, 48, 0.9) 0%, rgba(12, 8, 33, 0) 100%)",
      boxSizing: "border-box",
      flexShrink: 0
    }}>
      {/* Left: Avatar with Ring and Level / ID badge */}
      <div 
        onClick={onAvatarClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer"
        }}
      >
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          border: "2px solid #e4ca56",
          overflow: "hidden",
          boxShadow: "0 0 8px rgba(228, 202, 86, 0.4)",
          background: "rgba(0,0,0,0.3)"
        }}>
          <AvatarComp />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "white" }}>{profile.name}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ 
              fontSize: "0.6rem", 
              fontWeight: "900", 
              color: "#0c0821", 
              background: "#ecc94b", 
              padding: "1px 5px", 
              borderRadius: "4px" 
            }}>
              Lvl {profile.level}
            </span>
            <span style={{ fontSize: "0.62rem", color: "#b0a9c9", fontWeight: "700" }}>ID: {profile.id}</span>
          </div>
        </div>
      </div>

      {/* Center: Coins Capsule */}
      <div style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "4px 8px 4px 6px",
        borderRadius: "20px",
        gap: "6px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)"
      }}>
        <CoinIcon className="w-5 h-5" style={{ filter: "drop-shadow(0 1px 3px rgba(228,202,86,0.3))" }} />
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.85rem",
          fontWeight: "800",
          color: "white"
        }}>
          {profile.coins?.toLocaleString()}
        </span>
        <button 
          onClick={onChatClick} // We can redirect to Store on coin click or chat click
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#48bb78",
            border: "none",
            color: "white",
            fontSize: "0.8rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            lineHeight: "1"
          }}
          title="Add Coins"
        >
          +
        </button>
      </div>

      {/* Right: Icon Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button 
          onClick={onChatClick}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#c3bee0",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}
        >
          <ChatIcon className="w-4.5 h-4.5" />
        </button>

        <button 
          onClick={onSettingsClick}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#c3bee0",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}
        >
          <SettingsIcon className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
