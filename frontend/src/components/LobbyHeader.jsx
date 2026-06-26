import React from "react";
import { AVATARS, CoinIcon, SettingsIcon } from "./Avatars";
import Fallback3DIcon from "./Fallback3DIcon";

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
        <Fallback3DIcon
          iconKey="coin"
          fallback={<CoinIcon className="w-5 h-5" style={{ filter: "drop-shadow(0 1px 3px rgba(228,202,86,0.3))" }} />}
          style={{ width: "20px", height: "20px" }}
        />
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.85rem",
          fontWeight: "800",
          color: "white"
        }}>
          {profile.coins?.toLocaleString()}
        </span>
        <button 
          onClick={onChatClick} // Redirect to Store on coin click or chat click
          className="btn-3d-action"
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#48bb78",
            border: "none",
            borderBottom: "2px solid #2f855a",
            boxShadow: "0 2px 4px rgba(72,187,120,0.3)",
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
          className="btn-3d-action"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
            border: "none",
            borderBottom: "3px solid rgba(255,255,255,0.15)",
            boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
            color: "#c3bee0",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}
        >
          <Fallback3DIcon
            iconKey="action_chat"
            fallback={
              <svg viewBox="3.5 2.5 16 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5">
                <path d="M18.448 16.5L17.605 8.492C17.5759 8.21937 17.4468 7.96718 17.2428 7.78401C17.0388 7.60085 16.7742 7.49968 16.5 7.5H6.5C6.22622 7.50099 5.96246 7.60314 5.75941 7.7868C5.55637 7.97046 5.42836 8.22269 5.4 8.495L4.552 16.5C4.51798 16.8323 4.50062 17.166 4.5 17.5C4.5 18.0304 4.71071 18.5391 5.08579 18.9142C5.46086 19.2893 5.96957 19.5 6.5 19.5H16.5C17.0304 19.5 17.5391 19.2893 17.9142 18.9142C18.2893 18.5391 18.5 18.0304 18.5 17.5C18.4994 17.166 18.482 16.8323 18.448 16.5Z" fill="#FFEF5E"/>
                <path d="M16.5 7.5H6.5C6.22637 7.50097 5.96274 7.60297 5.75972 7.78643C5.5567 7.96988 5.42859 8.22187 5.4 8.494L4.552 16.5C4.51798 16.8323 4.50062 17.166 4.5 17.5C4.50044 17.7655 4.55371 18.0282 4.65673 18.2728C4.75974 18.5175 4.91043 18.7392 5.1 18.925L16.521 7.5H16.5Z" fill="#FFF9BF"/>
                <path d="M18.448 16.5L17.605 8.492C17.5759 8.21937 17.4468 7.96718 17.2428 7.78401C17.0388 7.60085 16.7742 7.49968 16.5 7.5H6.5C6.22622 7.50099 5.96246 7.60314 5.75941 7.7868C5.55637 7.97046 5.42836 8.22269 5.4 8.495L4.552 16.5C4.51798 16.8323 4.50062 17.166 4.5 17.5C4.5 18.0304 4.71071 18.5391 5.08579 18.9142C5.46086 19.2893 5.96957 19.5 6.5 19.5H16.5C17.0304 19.5 17.5391 19.2893 17.9142 18.9142C18.2893 18.5391 18.5 18.0304 18.5 17.5C18.4994 17.166 18.482 16.8323 18.448 16.5Z" stroke="#191919" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.5 11.5H10.342C10.1372 11.5018 9.94009 11.5782 9.78747 11.7148C9.63485 11.8513 9.53717 12.0388 9.51267 12.2421C9.48817 12.4455 9.53853 12.6508 9.65435 12.8197C9.77016 12.9886 9.9435 13.1096 10.142 13.16L12.866 13.84C13.0645 13.8904 13.2378 14.0114 13.3537 14.1803C13.4695 14.3492 13.5198 14.5545 13.4953 14.7579C13.4708 14.9612 13.3732 15.1487 13.2205 15.2852C13.0679 15.4218 12.8708 15.4982 12.666 15.5H9.5M11.5 11.5V10.5M11.5 16.5V15.5M8.5 9.5V6.5C8.5 5.70435 8.81607 4.94129 9.37868 4.37868C9.94129 3.81607 10.7044 3.5 11.5 3.5C12.2956 3.5 13.0587 3.81607 13.6213 4.37868C14.1839 4.94129 14.5 5.70435 14.5 6.5V9.5" stroke="#191919" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            style={{ width: "20px", height: "20px" }}
          />
        </button>

        <button 
          onClick={onSettingsClick}
          className="btn-3d-action"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
            border: "none",
            borderBottom: "3px solid rgba(255,255,255,0.15)",
            boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
            color: "#c3bee0",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}
        >
          <Fallback3DIcon
            iconKey="action_settings"
            fallback={<SettingsIcon className="w-4.5 h-4.5" />}
            style={{ width: "20px", height: "20px" }}
          />
        </button>
      </div>
    </div>
  );
}
