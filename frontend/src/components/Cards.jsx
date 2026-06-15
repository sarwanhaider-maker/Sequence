import { useState } from "react"

export default function Cards({roomId, socket, selectCard, cards, hoveredCard, playingAs, currentPlayerIndex}){

    function handleClick(cardId, selectCard, socket, card){
        let card_matches = card.matches;
        let validMove = false;
        
        // Two-eyed Jack (Wild) - ID 101 to 104
        if (selectCard > 100 && selectCard <= 104 && ![1, 10, 91, 100].includes(cardId) && !card.selected) {
            validMove = true;
        }
        // One-eyed Jack (Remove) - ID 105 to 108
        else if (selectCard > 104 && selectCard <= 108 && card.selected) {
            validMove = true;
        }
        // Standard card
        else if (card_matches.includes(selectCard) && !card.selected) {
            validMove = true;
        }

       if (playingAs === currentPlayerIndex && validMove) {
            socket?.emit('Boardcardclicked', { roomId, cardId: cardId, selectedCard: selectCard  });
        }
        else if (playingAs !== currentPlayerIndex) {
            alert("It's not your turn!");
        }
        else {
            alert('Invalid move! This action is not allowed.');
        }
    }
      
    return (
        <>
        <div className="inner-container">
             {cards.map((card) => (
                <div key={card.id} className={`card ${hoveredCard.includes(card.id) ? 'highlighted' : ''}`} 
                onClick={() => handleClick(card.id, selectCard, socket, card)}>
                    {card.img && <img src={card.img} alt={`Card ${card.id}`} />} 
                    {card.selected && card.selected === "True" && (
                        <div className={`poker-chip-${card.selectedby} absolute`}></div>
                    )}
                </div>
            ))}
        </div>
        </>
    )
}