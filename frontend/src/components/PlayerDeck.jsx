import React, { useState } from 'react';

const PlayerDeck = ({ socket, playerHand, setSelectCard, setHoveredCard, playingAs, currentPlayerIndex }) => {

  const [selectedCardId, setSelectedCardId] = useState(null);
  
  const handleCardClick = (card) => {
      const isSelected = selectedCardId === card.id;
      setSelectedCardId(isSelected ? null : card.id);
      setSelectCard(isSelected ? null : card.id);
  };

  const handleMouseEnter = (matches) => {
    setHoveredCard(matches);
  };

  const handleMouseLeave = () => {
    setHoveredCard([]);
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
            className={`hand-card ${selectedCardId === card.id ? 'selected' : ''}`}
            onClick={() => playingAs === currentPlayerIndex && handleCardClick(card)}
            onMouseEnter={() => handleMouseEnter(card.matches || [])}
            onMouseLeave={handleMouseLeave} 
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerDeck;