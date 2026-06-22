import React from "react";
import Swal from "sweetalert2";

export default function LobbyHome({ onPlayOnline, onPlayFriends, onPractice, boosters = { shield: 0, wildUpgrade: 0, reroll: 0 }, onGoToStore }) {
  
  const showTacticInfo = (tacticKey) => {
    const tacticsConfig = {
      wildUpgrade: {
        name: "Wild Upgrade 🃏",
        desc: "Upgrades any standard card in your hand to a Two-Eyed Jack (Wild Card) for the duration of your turn.",
        icon: "♣",
        count: boosters.wildUpgrade || 0
      },
      reroll: {
        name: "Card Redraw 🔄",
        desc: "Exchanges any card in your hand with a new card drawn from the deck.",
        icon: "💡",
        count: boosters.reroll || 0
      },
      shield: {
        name: "Chip Guard 🛡️",
        desc: "Protects one of your placed chips on the board from being removed by opponent's One-Eyed Jacks.",
        icon: "🛡️",
        count: boosters.shield || 0
      }
    };

    const tactic = tacticsConfig[tacticKey];
    if (!tactic) return;

    Swal.fire({
      title: tactic.name,
      html: `
        <div style="text-align: center; margin-bottom: 15px;">
          <span style="font-size: 3rem;">${tacticKey === 'shield' ? '🛡️' : tacticKey === 'wildUpgrade' ? '🃏' : '🔄'}</span>
        </div>
        <p style="color: #d1cde3; font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px;">${tactic.desc}</p>
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;">
          <span style="color: #b0a9c9; font-size: 0.85rem;">You Own:</span>
          <strong style="color: var(--accent-gold); font-size: 1.1rem; margin-left: 5px;">${tactic.count}</strong>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Buy in Store 💰",
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonText: "Close",
      background: '#1a123a',
      color: '#fff',
      iconColor: 'var(--accent-gold)'
    }).then((result) => {
      if (result.isConfirmed && onGoToStore) {
        onGoToStore();
      }
    });
  };
  
  const handleAdsClick = () => {
    Swal.fire({
      title: "Loading Sponsored Ad...",
      html: "<span style='color: #c3bee0;'>Earn 500 free coins by watching this sponsor video...</span>",
      timer: 3000,
      timerProgressBar: true,
      background: '#1a123a',
      color: '#fff',
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      onPlayOnline(500); // Reward 500 coins callback
      Swal.fire({
        title: "Reward Claimed!",
        text: "+500 coins have been added to your balance!",
        icon: "success",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
    });
  };

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      padding: "10px 14px",
      boxSizing: "border-box",
      animation: "fadeIn 0.35s ease-out"
    }}>
      
      {/* Boosters & Actions Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        width: "100%"
      }}>
        {/* Left Side icons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Share */}
          <button 
            onClick={() => {
              navigator.clipboard.writeText("https://sequence-liard-theta.vercel.app");
              Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 2000,
                icon: 'success',
                title: 'Copied!',
                text: 'Invite link copied to clipboard.',
                background: '#1e1932',
                color: '#fff',
                iconColor: '#10d9d2'
              });
            }}
            className="animate-pulse-cyan"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(16, 217, 210, 0.4)",
              color: "#10d9d2",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(16,217,210,0.15)",
              padding: 0
            }}
          >
            👥
          </button>
          {/* Mail */}
          <button 
            onClick={() => Swal.fire({
              title: "Inbox",
              text: "Your mail folder is empty.",
              icon: "info",
              background: '#1a123a',
              color: '#fff',
              confirmButtonColor: "var(--accent-cyan)"
            })}
            className="animate-pulse-gold"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ecc94b, #d69e2e)",
              border: "none",
              color: "#0c0821",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(228,202,86,0.3)",
              padding: 0
            }}
          >
            ✉️
          </button>
        </div>

        {/* Center: Tactics Panel */}
        <div className="glass-panel" style={{
          flex: 1,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          maxWidth: "230px"
        }}>
          <span style={{ fontSize: "0.68rem", fontWeight: "900", color: "#b0a9c9", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            TACTIC CARDS
          </span>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", width: "100%" }}>
            {/* Tactic 1: Wild Upgrade */}
            <div 
              className="tactic-card-lobby"
              onClick={() => showTacticInfo('wildUpgrade')}
              style={{
                background: "white",
                borderRadius: "8px",
                width: "44px",
                height: "56px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
                border: "1px solid #cbd5e0",
                position: "relative",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
              }}
              title="Wild Upgrade"
            >
              <span style={{ color: "#e53e3e", fontSize: "1.2rem", lineHeight: "1" }}>♣</span>
              <span style={{ 
                fontSize: "0.62rem", 
                fontWeight: "900", 
                color: "white", 
                background: "#dd6b20", 
                padding: "1px 6px", 
                borderRadius: "10px" 
              }}>
                {boosters.wildUpgrade || 0}
              </span>
            </div>

            {/* Tactic 2: Card Redraw */}
            <div 
              className="tactic-card-lobby"
              onClick={() => showTacticInfo('reroll')}
              style={{
                background: "white",
                borderRadius: "8px",
                width: "44px",
                height: "56px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
                border: "1px solid #cbd5e0",
                position: "relative",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
              }}
              title="Card Redraw"
            >
              <span style={{ color: "#2d3748", fontSize: "1.1rem", lineHeight: "1" }}>💡</span>
              <span style={{ 
                fontSize: "0.62rem", 
                fontWeight: "900", 
                color: "white", 
                background: "#dd6b20", 
                padding: "1px 6px", 
                borderRadius: "10px" 
              }}>
                {boosters.reroll || 0}
              </span>
            </div>

            {/* Tactic 3: Chip Guard */}
            <div 
              className="tactic-card-lobby"
              onClick={() => showTacticInfo('shield')}
              style={{
                background: "white",
                borderRadius: "8px",
                width: "44px",
                height: "56px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
                border: "1px solid #cbd5e0",
                position: "relative",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
              }}
              title="Chip Guard"
            >
              <span style={{ color: "#2d3748", fontSize: "1.1rem", lineHeight: "1" }}>🛡️</span>
              <span style={{ 
                fontSize: "0.62rem", 
                fontWeight: "900", 
                color: "white", 
                background: "#dd6b20", 
                padding: "1px 6px", 
                borderRadius: "10px" 
              }}>
                {boosters.shield || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side icon: Watch Ad */}
        <button 
          onClick={handleAdsClick}
          className="animate-pulse-green"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}
        >
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #48bb78, #2f855a)",
            color: "white",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(72,187,120,0.3)"
          }}>
            ▶
          </div>
          <span style={{ fontSize: "0.58rem", fontWeight: "800", color: "#ecc94b" }}>+500 ADS</span>
        </button>
      </div>

      {/* Stack of Game Option Buttons */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
        marginTop: "10px"
      }}>
        {/* PLAY ONLINE Banner */}
        <button 
          onClick={onPlayOnline}
          style={{
            background: "linear-gradient(135deg, #ecc94b 0%, #dd6b20 100%)",
            border: "none",
            borderRadius: "20px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 25px rgba(221,107,32,0.45)",
            cursor: "pointer",
            transition: "all 0.25s ease",
            textAlign: "left"
          }}
        >
          {/* Left: Gold Board graphic preview */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(0,0,0,0.15)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem"
            }}>
              🎮
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", fontWeight: "900", color: "#0c0821", letterSpacing: "1px" }}>
                PLAY ONLINE
              </span>
              <span style={{ fontSize: "0.72rem", color: "#4a3b1a", fontWeight: "700" }}>
                Stake coins & win big!
              </span>
            </div>
          </div>
          <span style={{ fontSize: "1.5rem", color: "#0c0821" }}>▶</span>
        </button>

        {/* PLAY WITH FRIENDS Banner */}
        <button 
          onClick={onPlayFriends}
          style={{
            background: "linear-gradient(135deg, #10d9d2 0%, #008080 100%)",
            border: "none",
            borderRadius: "20px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 25px rgba(16,217,210,0.3)",
            cursor: "pointer",
            transition: "all 0.25s ease",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(0,0,0,0.15)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem"
            }}>
              👥
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", fontWeight: "900", color: "#0c0821", letterSpacing: "0.5px" }}>
                PLAY WITH FRIENDS
              </span>
              <span style={{ fontSize: "0.72rem", color: "#054f4c", fontWeight: "700" }}>
                Create custom lobbies
              </span>
            </div>
          </div>
          <span style={{ fontSize: "1.5rem", color: "#0c0821" }}>▶</span>
        </button>

        {/* PRACTICE Banner */}
        <button 
          onClick={onPractice}
          style={{
            background: "linear-gradient(135deg, #b83280 0%, #702459 100%)",
            border: "none",
            borderRadius: "20px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 25px rgba(184,50,128,0.3)",
            cursor: "pointer",
            transition: "all 0.25s ease",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(0,0,0,0.15)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem"
            }}>
              🤖
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", fontWeight: "900", color: "white", letterSpacing: "1px" }}>
                PRACTICE
              </span>
              <span style={{ fontSize: "0.72rem", color: "#fbb6ce", fontWeight: "700" }}>
                Challenge smart AI bots offline
              </span>
            </div>
          </div>
          <span style={{ fontSize: "1.5rem", color: "white" }}>▶</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: "16px",
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.35)",
        fontSize: "0.68rem",
        lineHeight: "1.4",
        padding: "0 10px"
      }}>
        Disclaimer: This is an independent, non-commercial, open-source fan creation. It is not affiliated with, authorized, or endorsed by Jax Ltd., Zaesar Games, or any of their partners.
      </div>

    </div>
  );
}
