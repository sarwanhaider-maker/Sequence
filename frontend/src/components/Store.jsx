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

export default function Store({ onBuyCoins }) {
  const [activeTab, setActiveTab] = useState("COINS");

  const handlePurchase = (pack) => {
    Swal.fire({
      title: "Confirm Purchase",
      html: `Would you like to purchase <strong>${pack.coins.toLocaleString()} Coins</strong> for <strong>$${pack.price}</strong>?<br><br><small style="color:gray;">(This is a simulated Sandbox in-app purchase)</small>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Purchase",
      confirmButtonColor: "#48bb78"
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Processing payment...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          timer: 1500
        }).then(() => {
          onBuyCoins(pack.coins);
          Swal.fire(
            "Purchase Successful!",
            `Successfully credited ${pack.coins.toLocaleString()} coins to your account!`,
            "success"
          );
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
        {["COMBO", "COINS", "BOOSTERS"].map((tab) => (
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
      ) : (
        /* Empty/Locked State for Combo/Boosters */
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
          <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem" }}>Boosters and combo items will be purchasable in the next update!</p>
        </div>
      )}
    </div>
  );
}
