import React, { useState, useEffect } from 'react';

const PlayerDeck = ({ socket, playerHand, setSelectCard, setHoveredCard, playingAs, currentPlayerIndex }) => {

  const [selectedCardId, setSelectedCardId] = useState(null);
  
  const handleCardClick = (card) => {
      setSelectedCardId(prevId => prevId === card.id ? null : card.id);
      setSelectCard(card.id);
  };

  const handleMouseEnter = (matches) => {
    setHoveredCard(matches);
  };

  const handleMouseLeave = (matches) => {
    setHoveredCard([]);
  };

  return (
    <div className="player-deck-container absolute bottom-0 right-0 mb-4 mr-4">
      <div className="player-deck-header">
        Player Deck
      </div>
      <div className="player-deck-cards">
        {playerHand && playerHand.map((card) => (
          <img key={card.id} src={card.img && card.img.replace('../', '')} alt={`Card ${card.id}`}
            className={`w-16 h-24 mr-2 cursor-pointer ${selectedCardId === card.id ? 'selected-card' : ''}`}
            onClick={() => playingAs === currentPlayerIndex && handleCardClick(card)}
            onMouseEnter={() => handleMouseEnter(card.matches || [])}
            onMouseLeave={() => handleMouseLeave()} />
        ))}
      </div>
    </div>
  );
};

export default PlayerDeck;