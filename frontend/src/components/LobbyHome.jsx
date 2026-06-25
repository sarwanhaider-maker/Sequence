import React from "react";
import Swal from "sweetalert2";

export default function LobbyHome({ onPlayOnline, onPlayFriends, onPractice, boosters = {}, onGoToStore, activeDock = ["shield", "wildUpgrade"], onCustomizeDock }) {
  
  const showTacticInfo = (tacticKey) => {
    const tacticsConfig = {
      wildUpgrade: {
        name: "Wild Upgrade 🃏",
        desc: "Upgrades any standard card in your hand to a Two-Eyed Jack (Wild Card) for the duration of your turn.",
        icon: "🃏",
        count: boosters.wildUpgrade || 0
      },
      reroll: {
        name: "Card Redraw 🔄",
        desc: "Exchanges any card in your hand with a new card drawn from the deck.",
        icon: "🔄",
        count: boosters.reroll || 0
      },
      shield: {
        name: "Chip Guard 🛡️",
        desc: "Protects one of your placed chips on the board from being removed by opponent's One-Eyed Jacks.",
        icon: "🛡️",
        count: boosters.shield || 0
      },
      spy: {
        name: "Spying Glass 🔍",
        desc: "Spy on your opponent's cards in their hand for 3 seconds during your turn.",
        icon: "🔍",
        count: boosters.spy || 0
      },
      emp: {
        name: "Shield Breaker ⚡",
        desc: "Remove the Chip Guard protection shield from an opponent's chip on the board.",
        icon: "⚡",
        count: boosters.emp || 0
      },
      handExchange: {
        name: "Hand Exchange 🔀",
        desc: "Swap one of your hand cards with a random card from your opponent's hand.",
        icon: "🔀",
        count: boosters.handExchange || 0
      }
    };

    const tactic = tacticsConfig[tacticKey];
    if (!tactic) return;

    Swal.fire({
      title: tactic.name,
      html: `
        <div style="text-align: center; margin-bottom: 15px;">
          <span style="font-size: 3rem;">${tactic.icon}</span>
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
            <svg width="24" height="22" viewBox="0 0 71 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M58.3254 22.4143C59.9242 22.4143 61.5073 22.1309 62.9844 21.5803C64.4615 21.0296 65.8036 20.2225 66.9341 19.2051C68.0646 18.1876 68.9614 16.9797 69.5733 15.6503C70.1851 14.3209 70.5 12.8961 70.5 11.4572C70.5 10.0183 70.1851 8.59343 69.5733 7.26404C68.9614 5.93466 68.0646 4.72675 66.9341 3.70928C65.8036 2.69181 64.4615 1.88471 62.9844 1.33407C61.5073 0.783416 59.9242 0.5 58.3254 0.5C55.0965 0.5 51.9998 1.65441 49.7166 3.70928C47.4334 5.76415 46.1507 8.55115 46.1507 11.4572C46.1507 14.3632 47.4334 17.1502 49.7166 19.2051C51.9998 21.2599 55.0965 22.4143 58.3254 22.4143ZM12.6746 42.9572C15.9035 42.9572 19.0002 41.8028 21.2834 39.7479C23.5666 37.693 24.8493 34.906 24.8493 32C24.8493 29.094 23.5666 26.307 21.2834 24.2521C19.0002 22.1972 15.9035 21.0428 12.6746 21.0428C9.44572 21.0428 6.34906 22.1972 4.06587 24.2521C1.78268 26.307 0.5 29.094 0.5 32C0.5 34.906 1.78268 37.693 4.06587 39.7479C6.34906 41.8028 9.44572 42.9572 12.6746 42.9572ZM58.3254 63.5C59.9242 63.5 61.5073 63.2166 62.9844 62.6659C64.4615 62.1153 65.8036 61.3082 66.9341 60.2907C68.0646 59.2733 68.9614 58.0653 69.5733 56.736C70.1851 55.4066 70.5 53.9817 70.5 52.5428C70.5 51.1039 70.1851 49.6791 69.5733 48.3497C68.9614 47.0203 68.0646 45.8124 66.9341 44.7949C65.8036 43.7775 64.4615 42.9704 62.9844 42.4197C61.5073 41.8691 59.9242 41.5857 58.3254 41.5857C55.0965 41.5857 51.9998 42.7401 49.7166 44.7949C47.4334 46.8498 46.1507 49.6368 46.1507 52.5428C46.1507 55.4489 47.4334 58.2358 49.7166 60.2907C51.9998 62.3456 55.0965 63.5 58.3254 63.5Z" fill="#FFBC44"/>
              <path d="M58.3254 5.98046C61.0241 5.98166 63.6461 6.78921 65.7798 8.2764C67.9136 9.76359 69.4383 11.8463 70.1149 14.1976C70.5761 12.5796 70.6201 10.8881 70.2434 9.25252C69.8668 7.6169 69.0796 6.08046 67.9419 4.7607C66.8042 3.44094 65.3462 2.37283 63.6795 1.63803C62.0127 0.903243 60.1813 0.52124 58.3254 0.52124C56.4694 0.52124 54.638 0.903243 52.9712 1.63803C51.3045 2.37283 49.8465 3.44094 48.7089 4.7607C47.5712 6.08046 46.7839 7.6169 46.4073 9.25252C46.0307 10.8881 46.0746 12.5796 46.5359 14.1976C47.2124 11.8463 48.7371 9.76359 50.8709 8.2764C53.0046 6.78921 55.6266 5.98166 58.3254 5.98046ZM12.6746 26.5233C15.3734 26.5245 17.9954 27.332 20.1291 28.8192C22.2629 30.3064 23.7876 32.3891 24.4641 34.7404C24.9277 33.1215 24.9734 31.4286 24.5979 29.7913C24.2224 28.154 23.4356 26.6157 22.2977 25.2943C21.1598 23.9729 19.7011 22.9033 18.0331 22.1675C16.3651 21.4316 14.5322 21.0491 12.6746 21.0491C10.8171 21.0491 8.98413 21.4316 7.31616 22.1675C5.64819 22.9033 4.18942 23.9729 3.05154 25.2943C1.91366 26.6157 1.12685 28.154 0.751347 29.7913C0.375842 31.4286 0.421603 33.1215 0.885126 34.7404C1.56166 32.3891 3.08642 30.3064 5.22016 28.8192C7.3539 27.332 9.97586 26.5245 12.6746 26.5233ZM58.3254 47.0661C61.0241 47.0673 63.6461 47.8749 65.7798 49.3621C67.9136 50.8492 69.4383 52.9319 70.1149 55.2832C70.5761 53.6653 70.6201 51.9738 70.2434 50.3382C69.8668 48.7026 69.0796 47.1661 67.9419 45.8464C66.8042 44.5266 65.3462 43.4585 63.6795 42.7237C62.0127 41.9889 60.1813 41.6069 58.3254 41.6069C56.4694 41.6069 54.638 41.9889 52.9712 42.7237C51.3045 43.4585 49.8465 44.5266 48.7089 45.8464C47.5712 47.1661 46.7839 48.7026 46.4073 50.3382C46.0307 51.9738 46.0746 53.6653 46.5359 55.2832C47.2124 52.9319 48.7371 50.8492 50.8709 49.3621C53.0046 47.8749 55.6266 47.0673 58.3254 47.0661Z" fill="#FFE4B4"/>
              <path d="M23.5511 36.8944L47.4455 47.6484M47.4455 16.3486L23.5511 27.1026M58.3254 22.4143C59.9242 22.4143 61.5073 22.1309 62.9844 21.5803C64.4615 21.0296 65.8036 20.2225 66.9341 19.2051C68.0646 18.1876 68.9614 16.9797 69.5733 15.6503C70.1851 14.3209 70.5 12.8961 70.5 11.4572C70.5 10.0183 70.1851 8.59343 69.5733 7.26404C68.9614 5.93466 68.0646 4.72675 66.9341 3.70928C65.8036 2.69181 64.4615 1.88471 62.9844 1.33407C61.5073 0.783416 59.9242 0.5 58.3254 0.5C55.0965 0.5 51.9998 1.65441 49.7166 3.70928C47.4334 5.76415 46.1507 8.55115 46.1507 11.4572C46.1507 14.3632 47.4334 17.1502 49.7166 19.2051C51.9998 21.2599 55.0965 22.4143 58.3254 22.4143ZM12.6746 42.9572C14.2734 42.9572 15.8566 42.6738 17.3337 42.1231C18.8108 41.5725 20.1529 40.7654 21.2834 39.7479C22.4139 38.7304 23.3107 37.5225 23.9225 36.1931C24.5344 34.8637 24.8493 33.4389 24.8493 32C24.8493 30.5611 24.5344 29.1363 23.9225 27.8069C23.3107 26.4775 22.4139 25.2696 21.2834 24.2521C20.1529 23.2346 18.8108 22.4275 17.3337 21.8769C15.8566 21.3262 14.2734 21.0428 12.6746 21.0428C9.44572 21.0428 6.34905 22.1972 4.06587 24.2521C1.78268 26.307 0.5 29.094 0.5 32C0.5 34.906 1.78268 37.693 4.06587 39.7479C6.34905 41.8028 9.44572 42.9572 12.6746 42.9572ZM58.3254 63.5C59.9242 63.5 61.5073 63.2166 62.9844 62.6659C64.4615 62.1153 65.8036 61.3082 66.9341 60.2907C68.0646 59.2733 68.9614 58.0653 69.5733 56.736C70.1851 55.4066 70.5 53.9817 70.5 52.5428C70.5 51.1039 70.1851 49.6791 69.5733 48.3497C68.9614 47.0203 68.0646 45.8124 66.9341 44.7949C65.8036 43.7775 64.4615 42.9704 62.9844 42.4197C61.5073 41.8691 59.9242 41.5857 58.3254 41.5857C55.0965 41.5857 51.9998 42.7401 49.7166 44.7949C47.4334 46.8498 46.1507 49.6368 46.1507 52.5428C46.1507 55.4489 47.4334 58.2358 49.7166 60.2907C51.9998 62.3456 55.0965 63.5 58.3254 63.5Z" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", width: "100%" }}>
            {activeDock.map(key => {
              const count = boosters[key] || 0;
              const def = {
                shield: { name: 'Chip Guard', icon: '🛡️' },
                wildUpgrade: { name: 'Wild Upgrade', icon: '🃏' },
                reroll: { name: 'Card Redraw', icon: '🔄' },
                spy: { name: 'Spying Glass', icon: '🔍' },
                emp: { name: 'Shield Breaker', icon: '⚡' },
                handExchange: { name: 'Hand Exchange', icon: '🔀' }
              }[key] || { name: 'Unknown', icon: '❓' };

              return (
                <div 
                  key={key}
                  className="tactic-card-lobby"
                  onClick={() => showTacticInfo(key)}
                  style={{
                    background: "white",
                    borderRadius: "8px",
                    width: "46px",
                    height: "58px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    border: "1px solid #cbd5e0",
                    position: "relative",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                    cursor: "pointer"
                  }}
                  title={def.name}
                >
                  <span style={{ fontSize: "1.25rem", lineHeight: "1.2" }}>{def.icon}</span>
                  <span style={{ 
                    fontSize: "0.62rem", 
                    fontWeight: "900", 
                    color: "white", 
                    background: "#dd6b20", 
                    padding: "1px 6px", 
                    borderRadius: "10px" 
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={onCustomizeDock}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-cyan)",
              fontSize: "0.65rem",
              fontWeight: "800",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginTop: "2px",
              padding: "2px 6px",
              borderRadius: "4px",
              transition: "all 0.2s"
            }}
          >
            Edit Dock ⚙️
          </button>
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
