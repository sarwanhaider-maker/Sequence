import React from "react";
import Fallback3DIcon from "./Fallback3DIcon";

export default function LobbyBottomNav({ activeTab = "HOME", onTabChange, badges = { bonus: 1, tasks: 1 } }) {
  
  const TABS = [
    {
      id: "FRIENDS",
      label: "Friends",
      icon: (
        <Fallback3DIcon
          iconKey="nav_friends"
          fallback={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      )
    },
    {
      id: "DAILY_BONUS",
      label: "Daily Bonus",
      badge: badges.bonus,
      icon: (
        <Fallback3DIcon
          iconKey="nav_daily_bonus"
          fallback={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M12 2v20" />
              <path d="M12 7c2-3 5-3 5 0s-3 5-5 5" />
              <path d="M12 7c-2-3-5-3-5 0s3 5 5 5" />
              <path d="M3 11h18" />
            </svg>
          }
        />
      )
    },
    {
      id: "HOME",
      label: "Home",
      icon: (
        <Fallback3DIcon
          iconKey="nav_home"
          fallback={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
      )
    },
    {
      id: "DAILY_TASK",
      label: "Daily Task",
      badge: badges.tasks,
      icon: (
        <Fallback3DIcon
          iconKey="nav_daily_task"
          fallback={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
              <path d="M12 2a4.99 4.99 0 0 0-5 5v5a5 5 0 0 0 10 0V7a4.99 4.99 0 0 0-5-5z" />
            </svg>
          }
        />
      )
    },
    {
      id: "STORE",
      label: "Store",
      icon: (
        <Fallback3DIcon
          iconKey="nav_store"
          fallback={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M20 7h-9" />
              <path d="M14 2v5" />
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M3 12h18" />
            </svg>
          }
        />
      )
    }
  ];


  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      background: "linear-gradient(0deg, rgba(20, 10, 48, 0.95) 0%, rgba(12, 8, 33, 0.8) 100%)",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      height: "64px",
      boxSizing: "border-box",
      flexShrink: 0,
      paddingBottom: "env(safe-area-inset-bottom)"
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              background: "none",
              color: isActive ? "#10d9d2" : "#a0aec0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
              padding: 0
            }}
            className={isActive ? "nav-tab-active" : ""}
          >
            {/* Icon */}
            <div style={{
              transform: isActive ? "scale(1.08)" : "none",
              transition: "transform 0.2s ease"
            }}>
              {tab.icon}
            </div>

            {/* Label */}
            <span style={{
              fontSize: "0.68rem",
              fontWeight: isActive ? "800" : "600",
              fontFamily: "'Outfit', sans-serif"
            }}>
              {tab.label}
            </span>

            {/* Badge Indicator */}
            {tab.badge && tab.badge > 0 ? (
              <div style={{
                position: "absolute",
                top: "6px",
                right: "24%",
                background: "#e53e3e",
                color: "white",
                fontSize: "0.58rem",
                fontWeight: "900",
                minWidth: "14px",
                height: "14px",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                border: "1.5px solid #0c0821",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
              }}>
                {tab.badge}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
