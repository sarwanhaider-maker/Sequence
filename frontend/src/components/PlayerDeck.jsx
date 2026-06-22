import React from 'react';
import Swal from 'sweetalert2';

const PlayerDeck = ({ socket, playerHand, selectCard, setSelectCard, setHoveredCard, playingAs, currentPlayerIndex, setHoveredCardId, cards, roomId, boosterMode, setBoosterMode, setBoosters, setUsedBoosters }) => {

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
            className={`hand-card ${selectCard === card.id ? 'selected' : ''} ${card.isUpgradedWild ? 'wild-upgraded' : ''}`}
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