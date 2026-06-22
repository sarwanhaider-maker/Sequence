import React, { useState } from "react";
import { CoinIcon } from "./Avatars";
import Swal from "sweetalert2";

const COIN_PACKS = [
  { coins: 7000, price: 1.99, key: "coins_7k", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/a8e3427d-8a7b-4893-aeff-df3b78aa35f9" },
  { coins: 10000, price: 2.99, key: "coins_10k", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/8c8eec9a-173b-4d23-aa93-13906c392317" },
  { coins: 25000, price: 4.99, key: "coins_25k", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/389b5626-753e-453a-bf96-b686cef2fc6d" },
  { coins: 100000, price: 6.99, key: "coins_100k", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/8ea4bf0f-e978-4dcd-8131-300e3259db62" },
  { coins: 250000, price: 11.99, originalPrice: 15, key: "coins_250k", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/226286d7-3eaa-4ac4-9279-b235a42a11dc" },
  { coins: 500000, price: 19.99, originalPrice: 30, key: "coins_500k", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/c922d9c1-53d2-42e3-8bfb-fb1243dc8942" },
  { coins: 1000000, price: 29.99, originalPrice: 80, key: "coins_1m", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/ec9d3287-8694-4134-9431-47428936c64f" },
  { coins: 2000000, price: 49.99, originalPrice: 100, key: "coins_2m", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/21137cbd-cd2a-49bc-b616-97aceb5744a9" },
  { coins: 5000000, price: 69.99, originalPrice: 250, key: "coins_5m", checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/8f533f56-5f8d-4fe1-9a52-e24e4f52be80" }
];

const COMBO_PACKS = [
  {
    name: "Bronze Tactician Combo",
    price: 2.99,
    coins: 10000,
    boosters: { reroll: 2, shield: 1, wildUpgrade: 0 },
    icon: "🥉",
    description: "Get started with a neat coin stack and key tactical tools!",
    checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/83d84491-c125-4c37-9a1e-f0160cbbbb6b"
  },
  {
    name: "Silver Master Combo",
    price: 4.99,
    coins: 25000,
    boosters: { reroll: 0, shield: 3, wildUpgrade: 2 },
    icon: "🥈",
    description: "Reinforce your board position and gain control over wild jacks!",
    checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/96f3b943-4878-4f90-94f0-d6374a8fd931"
  },
  {
    name: "Gold Champion Combo",
    price: 9.99,
    coins: 75000,
    boosters: { reroll: 5, shield: 5, wildUpgrade: 5 },
    icon: "🥇",
    description: "The ultimate value bundle to dominate any online matches!",
    checkoutUrl: "https://zaesargame.lemonsqueezy.com/checkout/buy/16c69713-fd9e-48e2-a7d9-cf76b3099b7f"
  }
];

export default function Store({ onBuyCoins, playerCoins }) {
  const [activeTab, setActiveTab] = useState("COINS");

  const handlePurchase = (pack) => {
    Swal.fire({
      title: "Confirm Purchase",
      html: `
        <span style="color: #c3bee0;">Would you like to purchase <strong>${pack.coins.toLocaleString()} Coins</strong> for <strong>$${pack.price}</strong>?</span>
        <br><br>
        <p style="text-align: center; color: #10d9d2; font-weight: bold; margin-top: 15px; font-size: 0.85rem;">
          You will be redirected to Lemon Squeezy to complete payment securely.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Go to Checkout 💳",
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonText: "Cancel",
      background: '#1a123a',
      color: '#fff',
      iconColor: 'var(--accent-gold)'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(pack.checkoutUrl, "_blank");
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

  const handleBuyCombo = (combo) => {
    Swal.fire({
      title: "Confirm Combo Purchase",
      html: `
        <div style="text-align: left; color: #c3bee0; font-size: 0.9rem;">
          <p>Would you like to purchase the <strong>${combo.name}</strong> for <strong>$${combo.price}</strong>?</p>
          <div style="background: rgba(0,0,0,0.25); padding: 10px; border-radius: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.05);">
            <p style="margin: 4px 0; display: flex; align-items: center; gap: 6px;">💰 <strong>+${combo.coins.toLocaleString()} Coins</strong></p>
            ${combo.boosters.shield ? `<p style="margin: 4px 0; display: flex; align-items: center; gap: 6px;">🛡️ <strong>+${combo.boosters.shield} Chip Guards</strong></p>` : ''}
            ${combo.boosters.wildUpgrade ? `<p style="margin: 4px 0; display: flex; align-items: center; gap: 6px;">🃏 <strong>+${combo.boosters.wildUpgrade} Wild Upgrades</strong></p>` : ''}
            ${combo.boosters.reroll ? `<p style="margin: 4px 0; display: flex; align-items: center; gap: 6px;">🔄 <strong>+${combo.boosters.reroll} Card Redraws</strong></p>` : ''}
          </div>
          <p style="text-align: center; color: #10d9d2; font-weight: bold; margin-top: 15px; font-size: 0.85rem;">
            You will be redirected to Lemon Squeezy to complete payment securely.
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Go to Checkout 💳",
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonText: "Cancel",
      background: '#1a123a',
      color: '#fff',
      iconColor: 'var(--accent-gold)'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(combo.checkoutUrl, "_blank");
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
        /* Combo packs view */
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          {COMBO_PACKS.map((combo, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                background: "linear-gradient(135deg, #311e68 0%, #150d38 100%)",
                border: "1px solid rgba(167, 139, 250, 0.4)",
                borderRadius: "18px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Top Row: Icon & Name & Price */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  fontSize: "2.2rem",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  width: "52px",
                  height: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {combo.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "900", color: "#f8fafc", textAlign: "left" }}>
                    {combo.name}
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#a5b4fc", textAlign: "left", lineHeight: "1.2" }}>
                    {combo.description}
                  </p>
                </div>
              </div>

              {/* Items Granted List */}
              <div style={{
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "10px",
                padding: "8px 12px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: "800", color: "#fcd34d" }}>
                  <CoinIcon className="w-4 h-4" />
                  <span>+{combo.coins.toLocaleString()}</span>
                </div>
                {combo.boosters.shield > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: "700", color: "#e2e8f0" }}>
                    <span>🛡️</span>
                    <span>+{combo.boosters.shield} Guard</span>
                  </div>
                )}
                {combo.boosters.wildUpgrade > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: "700", color: "#e2e8f0" }}>
                    <span>🃏</span>
                    <span>+{combo.boosters.wildUpgrade} Wild</span>
                  </div>
                )}
                {combo.boosters.reroll > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: "700", color: "#e2e8f0" }}>
                    <span>🔄</span>
                    <span>+{combo.boosters.reroll} Redraw</span>
                  </div>
                )}
              </div>

              {/* Bottom Row: Buy Button & Discount Badge */}
              <div style={{ display: "flex", alignItems: "center", justifycontent: "space-between", gap: "8px" }}>
                {combo.price === 9.99 ? (
                  <div style={{
                    fontSize: "0.68rem",
                    fontWeight: "900",
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.5)",
                    color: "#f87171",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    textTransform: "uppercase"
                  }}>
                    Save 35%
                  </div>
                ) : combo.price === 4.99 ? (
                  <div style={{
                    fontSize: "0.68rem",
                    fontWeight: "900",
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                    color: "#34d399",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    textTransform: "uppercase"
                  }}>
                    Best Choice
                  </div>
                ) : (
                  <div style={{
                    fontSize: "0.68rem",
                    fontWeight: "900",
                    background: "rgba(99, 102, 241, 0.2)",
                    border: "1px solid rgba(99, 102, 241, 0.5)",
                    color: "#818cf8",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    textTransform: "uppercase"
                  }}>
                    Popular
                  </div>
                )}
                
                <button
                  onClick={() => handleBuyCombo(combo)}
                  className="btn-cyan-glow"
                  style={{
                    padding: "7px 18px",
                    borderRadius: "14px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: "900",
                    cursor: "pointer",
                    marginLeft: "auto"
                  }}
                >
                  Buy ${combo.price}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
