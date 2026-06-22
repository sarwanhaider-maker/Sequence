import React, { useState } from "react";
import { CoinIcon } from "./Avatars";
import Swal from "sweetalert2";

const COIN_PACKS = [
  { coins: 7000, price: 1.99 },
  { coins: 10000, price: 2.99 },
  { coins: 25000, price: 4.99 },
  { coins: 100000, price: 6.99 },
  { coins: 250000, price: 11.99, originalPrice: 15 },
  { coins: 500000, price: 19.99, originalPrice: 30 },
  { coins: 1000000, price: 29.99, originalPrice: 80 },
  { coins: 2000000, price: 49.99, originalPrice: 100 },
  { coins: 5000000, price: 69.99, originalPrice: 250 }
];

export default function Store({ onBuyCoins, playerCoins }) {
  const [activeTab, setActiveTab] = useState("COINS");

  const handlePurchase = (pack) => {
    Swal.fire({
      title: "Confirm Purchase",
      html: `<span style="color: #c3bee0;">Would you like to purchase <strong>${pack.coins.toLocaleString()} Coins</strong> for <strong>$${pack.price}</strong>?</span><br><br><small style="color:gray;">(This is a simulated Sandbox in-app purchase)</small>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Purchase",
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonText: "Cancel",
      background: '#1a123a',
      color: '#fff',
      iconColor: 'var(--accent-gold)'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Processing payment...",
          allowOutsideClick: false,
          background: '#1a123a',
          color: '#fff',
          didOpen: () => {
            Swal.showLoading();
          },
          timer: 1500
        }).then(() => {
          onBuyCoins(pack.coins);
          Swal.fire({
            title: "Purchase Successful!",
            text: `Successfully credited ${pack.coins.toLocaleString()} coins to your account!`,
            icon: "success",
            background: '#1a123a',
            color: '#fff',
            confirmButtonColor: "var(--accent-cyan)"
          });
        });
      }
    });
  };

  const handleBuyBooster = (boosterKey, cost) => {
    const currentCoins = playerCoins !== undefined ? playerCoins : parseInt(localStorage.getItem("seq_coins") || "0");
    if (currentCoins < cost) {
      Swal.fire({
        title: "Insufficient Coins!",
        text: `You need ${cost.toLocaleString()} coins to purchase this tactic card.`,
        icon: "error",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
      return;
    }

    Swal.fire({
      title: "Confirm Purchase",
      html: `<span style="color: #c3bee0;">Purchase Tactic Card for <strong>${cost.toLocaleString()} Coins</strong>?</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Buy",
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonText: "Cancel",
      background: '#1a123a',
      color: '#fff',
      iconColor: 'var(--accent-gold)'
    }).then((result) => {
      if (result.isConfirmed) {
        onBuyCoins(-cost);
        
        // Update booster count in localStorage
        const savedBoostersStr = localStorage.getItem("seq_boosters");
        let boostersObj = { shield: 0, wildUpgrade: 0, reroll: 0 };
        if (savedBoostersStr) {
          try {
            boostersObj = JSON.parse(savedBoostersStr);
          } catch (e) {}
        }
        boostersObj[boosterKey] = (boostersObj[boosterKey] || 0) + 1;
        localStorage.setItem("seq_boosters", JSON.stringify(boostersObj));

        Swal.fire({
          title: "Tactic Card Purchased!",
          text: `Successfully purchased 1 Tactic Card! You now have ${boostersObj[boosterKey]}.`,
          icon: "success",
          background: '#1a123a',
          color: '#fff',
          confirmButtonColor: "var(--accent-cyan)"
        });
      }
    });
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
      {/* Visual store striped awning top */}
      <div style={{
        background: "repeating-linear-gradient(90deg, #4c1d95, #4c1d95 20px, #7c3aed 20px, #7c3aed 40px)",
        height: "20px",
        borderRadius: "8px 8px 0 0",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
      }} />

      {/* Navigation tabs */}
      <div style={{
        display: "flex",
        background: "rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "25px",
        padding: "3px"
      }}>
        {["COMBO", "COINS", "TACTICS"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "22px",
              border: "none",
              color: activeTab === tab ? "#0c0821" : "#b0a9c9",
              background: activeTab === tab 
                ? "linear-gradient(135deg, #e4ca56 0%, #c1a41f 100%)" 
                : "none",
              fontSize: "0.85rem",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "COINS" ? (
        /* 3x3 coins packages grid */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px"
        }}>
          {COIN_PACKS.map((pack, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                background: "linear-gradient(135deg, #2c1e57 0%, #150d38 100%)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "16px",
                padding: "12px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
              }}
            >
              {/* Coins amount text */}
              <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#e2e8f0", textAlign: "center" }}>
                {pack.coins.toLocaleString()}
              </div>

              {/* Coin stack visual */}
              <div style={{ position: "relative", height: "36px", display: "flex", alignItems: "center" }}>
                <CoinIcon className="w-8 h-8" style={{ filter: "drop-shadow(0 2px 5px rgba(228,202,86,0.4))" }} />
              </div>

              {/* Crossed out original price (if any) */}
              {pack.originalPrice ? (
                <div style={{ fontSize: "0.7rem", color: "#e53e3e", textDecoration: "line-through", height: "14px", lineHeight: "1" }}>
                  ${pack.originalPrice}
                </div>
              ) : (
                <div style={{ height: "14px" }} /> /* Spacer */
              )}

              {/* Price button */}
              <button
                onClick={() => handlePurchase(pack)}
                className="btn-cyan-glow"
                style={{
                  width: "100%",
                  padding: "5px 0",
                  borderRadius: "15px",
                  border: "none",
                  fontSize: "0.78rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                ${pack.price}
              </button>
            </div>
          ))}
        </div>
      ) : activeTab === "TACTICS" ? (
        /* Boosters shop list */
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {[
            {
              key: "shield",
              name: "Chip Guard",
              desc: "Shield one of your chips on the board from being removed by opponent's One-Eyed Jacks.",
              price: 3000,
              icon: "🛡️"
            },
            {
              key: "wildUpgrade",
              name: "Wild Upgrade",
              desc: "Temporarily turn one of your hand cards into a Two-Eyed Jack (Wild Card) for this turn.",
              price: 5000,
              icon: "🃏"
            },
            {
              key: "reroll",
              name: "Card Redraw",
              desc: "Swap any card in your hand with a random card from the remaining deck during your turn.",
              price: 1500,
              icon: "🔄"
            }
          ].map((booster) => (
            <div
              key={booster.key}
              className="glass-card"
              style={{
                background: "linear-gradient(135deg, #2c1e57 0%, #150d38 100%)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
              }}
            >
              <div style={{ fontSize: "2rem" }}>{booster.icon}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#e2e8f0", textAlign: "left" }}>{booster.name}</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#b0a9c9", lineHeight: "1.2", textAlign: "left" }}>{booster.desc}</p>
              </div>
              <button
                onClick={() => handleBuyBooster(booster.key, booster.price)}
                className="btn-cyan-glow"
                style={{
                  padding: "8px 12px",
                  borderRadius: "15px",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                💰 {booster.price.toLocaleString()}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty/Locked State for Combo */
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#b0a9c9",
          background: "rgba(0,0,0,0.15)",
          borderRadius: "16px",
          border: "1px dashed rgba(255,255,255,0.1)"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔒</div>
          <h4 style={{ margin: 0, fontWeight: "700" }}>Locked in Beta</h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem" }}>Combo items will be purchasable in the next update!</p>
        </div>
      )}
    </div>
  );
}
