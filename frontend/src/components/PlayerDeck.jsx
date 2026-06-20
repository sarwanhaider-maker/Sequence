import React from 'react';

const PlayerDeck = ({ socket, playerHand, selectCard, setSelectCard, setHoveredCard, playingAs, currentPlayerIndex, setHoveredCardId, cards, roomId }) => {

  const isDeadCard = (card) => {
    if (!card.matches || card.matches.length === 0) return false;
    return card.matches.every(cellId => {
      const boardCell = cards && cards.find(c => c.id === cellId);
      return boardCell && boardCell.selected === "True";
    });
  };

  const handleCardClick = (card) => {
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
            className={`hand-card ${selectCard === card.id ? 'selected' : ''}`}
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