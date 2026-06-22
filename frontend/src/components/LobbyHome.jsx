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
                title: "Invite Link Copied!",
                html: `
                  <div style="text-align: center; color: #c3bee0; font-size: 0.92rem; padding: 10px 0;">
                    <p style="margin-bottom: 20px;">The invite link has been copied to your clipboard. Share it directly with your friends on social media:</p>
                    
                    <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin: 15px 0;">
                      <!-- WhatsApp -->
                      <a href="https://api.whatsapp.com/send?text=Play%20Sequence%20online%20with%20me%21%20https%3A%2F%2Fsequence-liard-theta.vercel.app" 
                         target="_blank" rel="noopener noreferrer" title="Share on WhatsApp"
                         style="width: 48px; height: 48px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(37,211,102,0.3);"
                         onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        <svg style="width: 22px; height: 22px; fill: white;" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.275 0 9.57-4.293 9.573-9.568.001-2.553-1.001-4.953-2.822-6.776C16.2 2.438 13.8 1.437 11.244 1.437c-5.277 0-9.572 4.293-9.575 9.569-.001 1.564.487 3.09 1.412 4.41l-.979 3.57 3.655-.959zM15.5 17.5c-.3-.15-1.75-.85-2.05-.95-.3-.1-.5-.15-.7.15-.2.3-.75.95-.9 1.1-.15.15-.3.2-.6.05-1.2-.5-2.1-1.1-2.9-2.5-.2-.35 0-.6.15-.8.15-.15.3-.35.45-.5.15-.15.2-.25.3-.45.1-.2.05-.4 0-.55-.05-.15-.5-1.2-.7-1.7-.2-.45-.4-.4-.55-.4h-.45c-.15 0-.4.05-.6.25-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.15 1.8 2.7 4.3 3.8.6.25 1.1.4 1.5.55.6.2 1.15.15 1.6.1.5-.05 1.75-.7 2-1.35.25-.65.25-1.2.15-1.3-.1-.15-.3-.25-.6-.4z"/>
                        </svg>
                      </a>
                      
                      <!-- Telegram -->
                      <a href="https://t.me/share/url?url=https%3A%2F%2Fsequence-liard-theta.vercel.app&text=Play%20Sequence%20online%20with%20me%21" 
                         target="_blank" rel="noopener noreferrer" title="Share on Telegram"
                         style="width: 48px; height: 48px; border-radius: 50%; background: #0088cc; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(0,136,204,0.3);"
                         onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
                          <path d="M9.78 18.65l.28-4.28 7.68-6.93c.34-.3-.07-.46-.52-.18L7.69 13.25l-4.14-1.3c-.9-.28-.92-.9.19-1.34L20.07 4.3c.75-.28 1.4.17 1.15 1.36l-2.78 13.07c-.2 1-.8 1.24-1.62.78l-4.24-3.13-2.04 1.97c-.22.22-.4.4-.82.4z"/>
                        </svg>
                      </a>
                      
                      <!-- Twitter / X -->
                      <a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fsequence-liard-theta.vercel.app&text=Play%20Sequence%20online%20with%20me%21" 
                         target="_blank" rel="noopener noreferrer" title="Share on X"
                         style="width: 48px; height: 48px; border-radius: 50%; background: #000000; border: 1.5px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; text-decoration: none; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"
                         onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        <svg style="width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                      
                      <!-- Facebook -->
                      <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fsequence-liard-theta.vercel.app" 
                         target="_blank" rel="noopener noreferrer" title="Share on Facebook"
                         style="width: 48px; height: 48px; border-radius: 50%; background: #1877F2; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(24,119,242,0.3);"
                         onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        <svg style="width: 22px; height: 22px; fill: white;" viewBox="0 0 24 24">
                          <path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h3V1h-3c-3 0-5 2-5 5v2z"/>
                        </svg>
                      </a>
                      
                      <!-- Instagram -->
                      <a href="https://instagram.com" 
                         target="_blank" rel="noopener noreferrer" title="Share on Instagram"
                         style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); display: flex; align-items: center; justify-content: center; text-decoration: none; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(188,24,136,0.3);"
                         onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                `,
                icon: "success",
                background: '#1a123a',
                color: '#fff',
                confirmButtonColor: "var(--accent-cyan)",
                confirmButtonText: "Done"
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
