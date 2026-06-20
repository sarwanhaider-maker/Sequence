import React from "react";

export default function Cards({ roomId, socket, selectCard, setSelectCard, cards, hoveredCard, playingAs, currentPlayerIndex, protectedPatterns, hoveredCardId, myTeam }) {

    function handleClick(cardId, selectCard, socket, card) {
        let card_matches = card.matches;
        let validMove = false;
        
        // Two-eyed Jack (Wild) - ID 101 to 104
        if (selectCard > 100 && selectCard <= 104 && ![1, 10, 91, 100].includes(cardId) && !card.selected) {
            validMove = true;
        }
        // One-eyed Jack (Remove) - ID 105 to 108
        else if (selectCard > 104 && selectCard <= 108 && card.selected && card.selectedby !== myTeam) {
            validMove = true;
        }
        // Standard card
        else if (card_matches.includes(selectCard) && !card.selected) {
            validMove = true;
        }

        if (playingAs === currentPlayerIndex) {
            if (validMove) {
                socket?.emit('Boardcardclicked', { roomId, cardId: cardId, selectedCard: selectCard });
            } else {
                // Tapping back on board cancels selection and restores board brightness
                if (setSelectCard) {
                    setSelectCard(null);
                }
            }
        } else {
            alert("It's not your turn!");
        }
    }

    const isProtected = (id) => {
        return (protectedPatterns || []).some(pattern => pattern.includes(id));
    };

    const isMyTurn = playingAs === currentPlayerIndex;
    const activeCardId = selectCard || hoveredCardId;

    const checkIsValidTarget = (card) => {
        if (!activeCardId) return false;
        
        // Two-eyed Jack (Wild) - ID 101 to 104
        if (activeCardId > 100 && activeCardId <= 104) {
            return ![1, 10, 91, 100].includes(card.id) && !card.selected;
        }
        // One-eyed Jack (Remove) - ID 105 to 108
        if (activeCardId > 104 && activeCardId <= 108) {
            return card.selected && card.selected === "True" && !isProtected(card.id) && card.selectedby !== myTeam;
        }
        // Standard card
        return card.matches && card.matches.includes(activeCardId) && !card.selected;
    };
      
    return (
        <div className="board-container">
            <div className="board-border-text left-border-text">ONE-EYED JACKS: REMOVE CHIP</div>
            <div className="board-grid">
                 {cards.map((card) => {
                     const protectedClass = isProtected(card.id) ? "seq-protected" : "";
                     const isCorner = [1, 10, 91, 100].includes(card.id);
                     const isHighlighted = checkIsValidTarget(card);
                     return (
                        <div 
                            key={card.id} 
                            className={`card ${isCorner ? 'corner' : ''} ${protectedClass} ${isHighlighted ? 'highlighted' : ''}`} 
                            onClick={() => handleClick(card.id, selectCard, socket, card)}
                        >
                            {card.img && (
                                <img 
                                    src={"/" + card.img.replace('../', '')} 
                                    alt={`Card ${card.id}`} 
                                    style={{ width: "100%", height: "100%", borderRadius: "4px", objectFit: "fill" }}
                                />
                            )} 
                            {card.selected && card.selected === "True" && (
                                <div className={`chip chip-${card.selectedby}`}></div>
                            )}
                        </div>
                     );
                 })}
            </div>
            <div className="board-border-text right-border-text">TWO-EYED JACKS: PLACE WILD CHIP</div>
        </div>
    );
}