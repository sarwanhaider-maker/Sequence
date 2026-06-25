import React from 'react';
import Swal from 'sweetalert2';

const PlayerDeck = ({ socket, playerHand, selectCard, setSelectCard, setHoveredCard, playingAs, currentPlayerIndex, setHoveredCardId, cards, roomId, boosterMode, setBoosterMode, setBoosters, setUsedBoosters, players }) => {

  const isDeadCard = (card) => {
    if (!card.matches || card.matches.length === 0) return false;
    return card.matches.every(cellId => {
      const boardCell = cards && cards.find(c => c.id === cellId);
      return boardCell && boardCell.selected === "True";
    });
  };

  const handleCardClick = (card) => {
      if (boosterMode === 'wildUpgrade') {
          if (card.id > 100) {
              Swal.fire({
                  title: "Invalid Card",
                  text: "You can only upgrade standard cards, not Jacks!",
                  icon: "warning",
                  background: '#1a123a',
                  color: '#fff',
                  confirmButtonColor: "var(--accent-cyan)"
              });
              return;
          }
          
          socket?.emit('use_booster_wild_upgrade', { roomId, handCardId: card.id });

          setBoosters(prev => {
              const next = { ...prev, wildUpgrade: Math.max(0, prev.wildUpgrade - 1) };
              localStorage.setItem("seq_boosters", JSON.stringify(next));
              return next;
          });
          setUsedBoosters(prev => ({ ...prev, wildUpgrade: true }));
          setBoosterMode(null);
          
          Swal.fire({
              title: "Card Upgraded!",
              text: "Your card is now a Wild Jack for this turn.",
              icon: "success",
              background: '#1a123a',
              color: '#fff',
              confirmButtonColor: "var(--accent-cyan)"
          });
          return;
      }

      if (boosterMode === 'reroll') {
          socket?.emit('use_booster_reroll', { roomId, handCardId: card.id });

          setBoosters(prev => {
              const next = { ...prev, reroll: Math.max(0, prev.reroll - 1) };
              localStorage.setItem("seq_boosters", JSON.stringify(next));
              return next;
          });
          setUsedBoosters(prev => ({ ...prev, reroll: true }));
          setBoosterMode(null);

          Swal.fire({
              title: "Card Redrawn!",
              text: "You exchanged your card for a new one from the deck.",
              icon: "success",
              background: '#1a123a',
              color: '#fff',
              confirmButtonColor: "var(--accent-cyan)"
          });
          return;
      }

      if (boosterMode === 'handExchange') {
          const otherPlayers = (players || []).filter((p, idx) => idx !== playingAs);

          const triggerHandExchange = (targetSocketId) => {
              socket?.emit('use_booster_hand_exchange', { roomId, handCardId: card.id, targetSocketId });

              setBoosters(prev => {
                  const next = { ...prev, handExchange: Math.max(0, prev.handExchange - 1) };
                  localStorage.setItem("seq_boosters", JSON.stringify(next));
                  return next;
              });
              setUsedBoosters(prev => ({ ...prev, handExchange: true }));
              setBoosterMode(null);
          };

          if (otherPlayers.length > 1) {
              let targetHtml = `<div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">`;
              otherPlayers.forEach(p => {
                const teamColor = p.team === 'blue' ? '#3b82f6' : p.team === 'red' ? '#ef4444' : p.team === 'green' ? '#22c55e' : '#fff';
                const rbgVal = p.team === 'blue' ? '59, 130, 246' : p.team === 'red' ? '239, 68, 68' : p.team === 'green' ? '34, 197, 94' : '255, 255, 255';
                targetHtml += `
                  <button class="target-player-btn" data-socketid="${p.socketId}" style="
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    width: 100%;
                    background: rgba(25, 20, 45, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 14px 20px;
                    color: #fff;
                    font-family: inherit;
                    font-size: 0.95rem;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
                  " onmouseover="this.style.background='rgba(${rbgVal}, 0.12)'; this.style.borderColor='${teamColor}'; this.style.boxShadow='0 0 15px rgba(${rbgVal}, 0.4)'; this.style.transform='translateY(-2px)';"
                     onmouseout="this.style.background='rgba(25, 20, 45, 0.6)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.15)'; this.style.transform='none';">
                     <div style="width: 12px; height: 12px; border-radius: 50%; background: ${teamColor}; box-shadow: 0 0 10px ${teamColor}; flex-shrink: 0;"></div>
                     <div style="flex: 1;">
                       <div style="font-weight: 700; color: #fff; font-size: 1rem; margin-bottom: 2px;">${p.name}</div>
                       <div style="font-size: 0.72rem; color: #b0a9c9; text-transform: uppercase; letter-spacing: 0.8px;">${p.team} Team</div>
                     </div>
                     <div style="font-size: 1.2rem; opacity: 0.9; text-shadow: 0 0 8px ${teamColor};">🔀</div>
                  </button>
                `;
              });
              targetHtml += `</div>`;

              Swal.fire({
                  title: "Select Opponent to Exchange Hand With",
                  html: targetHtml,
                  showConfirmButton: false,
                  showCancelButton: true,
                  cancelButtonText: "Cancel",
                  cancelButtonColor: "rgba(255, 255, 255, 0.12)",
                  background: '#150d2a',
                  color: '#fff',
                  customClass: {
                      popup: 'premium-target-popup',
                      title: 'premium-target-title'
                  },
                  didOpen: () => {
                      const buttons = Swal.getHtmlContainer().querySelectorAll('.target-player-btn');
                      buttons.forEach(btn => {
                          btn.addEventListener('click', () => {
                              const targetSocketId = btn.getAttribute('data-socketid');
                              Swal.close();
                              triggerHandExchange(targetSocketId);
                          });
                      });
                  }
              });
          } else {
              triggerHandExchange(otherPlayers[0]?.socketId);
          }
          return;
      }

      if (isDeadCard(card)) {
          socket?.emit('deadCardClicked', { roomId, cardId: card.id });
          return;
      }
      const isSelected = selectCard === card.id;
      setSelectCard(isSelected ? null : card.id);
  };

  const handleMouseEnter = (card) => {
    setHoveredCard(card.matches || []);
    if (setHoveredCardId) {
      setHoveredCardId(card.id);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCard([]);
    if (setHoveredCardId) {
      setHoveredCardId(null);
    }
  };

  return (
    <div className="hand-container">
      <div className="hand-title">YOUR HAND</div>
      <div className="hand-cards">
        {playerHand && playerHand.map((card) => (
          <img 
            key={card.id} 
            src={card.img && ("/" + card.img.replace('../', ''))} 
            alt={`Card ${card.id}`}
            className={`hand-card ${selectCard === card.id ? 'selected' : ''} ${card.isUpgradedWild ? 'wild-upgraded' : ''} ${boosterMode === 'handExchange' ? 'exchange-targetable' : ''}`}
            onClick={() => playingAs === currentPlayerIndex && handleCardClick(card)}
            onMouseEnter={() => handleMouseEnter(card)}
            onMouseLeave={handleMouseLeave} 
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerDeck;