function shuffleDeck(cards) {
    let shuffledCards = cards.slice();
    for (let i = shuffledCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }
    return shuffledCards;
}

function initializeGame(cards, playerSockets, playerNames, gameMode) {
    let numPlayers = playerSockets.length;
    let handSize = 4;
    let targetSequences = 2;
    let useGreen = false;

    if (gameMode === "2_players") {
        handSize = 7;
        targetSequences = 2;
    } else if (gameMode === "3_players") {
        handSize = 6;
        targetSequences = 1;
        useGreen = true;
    } else if (gameMode === "4_players") {
        handSize = 6;
        targetSequences = 2;
    } else if (gameMode === "6_players_3_teams") {
        handSize = 5;
        targetSequences = 1;
        useGreen = true;
    } else if (gameMode === "6_players_2_teams") {
        handSize = 5;
        targetSequences = 2;
    } else if (gameMode === "8_players") {
        handSize = 4;
        targetSequences = 2;
    }

    const initialDeck = shuffleDeck(
        cards.filter((card) => ![1, 10, 91, 100].includes(card.id))
    );

    let players = [];
    for (let i = 0; i < numPlayers; i++) {
        let hand = initialDeck.slice(i * handSize, (i + 1) * handSize);
        let team = "blue";
        if (useGreen) {
            team = i % 3 === 0 ? "blue" : (i % 3 === 1 ? "red" : "green");
        } else {
            team = i % 2 === 0 ? "blue" : "red";
        }
        players.push({
            socketId: playerSockets[i],
            name: playerNames[i],
            hand: hand,
            isTurn: i === 0,
            team: team,
            index: i
        });
    }

    let remainingDeck = initialDeck.slice(numPlayers * handSize);

    let scores = { red: 0, blue: 0 };
    if (useGreen) {
        scores.green = 0;
    }

    return {
        players: players,
        scores: scores,
        shuffledDeck: remainingDeck,
        cards: null,
        protectedPatterns: [],
        targetSequences: targetSequences
    };
}

function handleCardSelection(
    game,
    cardId,
    shuffledDeck,
    cards,
    socketId,
    selectedCard
) {
    let cardIndex = cardId - 1;
    let currentPlayer = game.players.find(p => p.socketId === socketId);
    if (!currentPlayer) {
        return { success: false, message: "Player not found." };
    }
    let playerHand = currentPlayer.hand;
    let cardInQuestion = game.cards[cardIndex];

    const isCardProtected = (id) => {
        return (game.protectedPatterns || []).some(pattern => pattern.includes(id));
    };

    if (selectedCard > 100 && selectedCard <= 104) {
        cardInQuestion.selected = "True";
        cardInQuestion.selectedby = currentPlayer.team;
    }
    else if (selectedCard > 104 && selectedCard <= 108) {
        if (cardInQuestion.selected !== "True") {
            return { success: false, message: "Wrong move: One-Eyed Jack can only remove chips." };
        }
        if (cardInQuestion.selectedby === currentPlayer.team) {
            return { success: false, message: "Wrong move: Cannot remove your own chip with a One-Eyed Jack." };
        }
        if (!isCardProtected(cardInQuestion.id)) {
            cardInQuestion.selected = false;
            cardInQuestion.selectedby = "";
        }
        else {
            return { success: false, message: "Wrong move: Card is protected." };
        }
    }
    else {
        cardInQuestion.selected = "True";
        cardInQuestion.selectedby = currentPlayer.team;
    }

    let indexToRemove = playerHand.findIndex(
        (card) => card.id === cardId || (selectedCard > 100 && selectedCard < 109 && card.id === selectedCard) || (card.matches && card.matches.includes(cardId))
    );
    if (indexToRemove !== -1) {
        playerHand.splice(indexToRemove, 1);
    }
    if (shuffledDeck.length > 0) {
        let newCard = shuffledDeck.shift();
        playerHand.push(newCard);
    }

    currentPlayer.hand = playerHand;

    // Advance turn
    let currentIndex = game.players.findIndex(p => p.socketId === socketId);
    game.players[currentIndex].isTurn = false;
    let nextIndex = (currentIndex + 1) % game.players.length;
    game.players[nextIndex].isTurn = true;

    return { success: true, game, shuffledDeck, cards };
}

function Pattern(game, cards) {
    let board = Array(10).fill(null).map((_, r) => {
        return Array(10).fill(null).map((_, c) => {
            const index = r * 10 + c + 1;
            return { color: null, isPartOfPattern: false, index: index };
        });
    });
    
    const cornerIndices = [1, 10, 91, 100];
    const isCornerIndex = (index) => cornerIndices.includes(index);

    if (Array.isArray(cards)) {
        cards.forEach((card) => {
            if (card.selected === "True") {
                const row = Math.floor((card.id - 1) / 10);
                const col = (card.id - 1) % 10;
                board[row][col] = { color: card.selectedby, isPartOfPattern: false, index: card.id };
            }
        });
    }

    // Unique Down-Right diagonals
    let downRightDiagonals = [];
    for (let r = 0; r <= 5; r++) {
        let cells = [];
        for (let i = 0; r + i < 10 && i < 10; i++) {
            cells.push(board[r + i][i]);
        }
        if (cells.length >= 5) downRightDiagonals.push(cells);
    }
    for (let c = 1; c <= 5; c++) {
        let cells = [];
        for (let i = 0; i < 10 && c + i < 10; i++) {
            cells.push(board[i][c + i]);
        }
        if (cells.length >= 5) downRightDiagonals.push(cells);
    }

    // Unique Up-Right diagonals
    let upRightDiagonals = [];
    for (let r = 4; r <= 9; r++) {
        let cells = [];
        for (let i = 0; r - i >= 0 && i < 10; i++) {
            cells.push(board[r - i][i]);
        }
        if (cells.length >= 5) upRightDiagonals.push(cells);
    }
    for (let c = 1; c <= 5; c++) {
        let cells = [];
        for (let i = 0; 9 - i >= 0 && c + i < 10; i++) {
            cells.push(board[9 - i][c + i]);
        }
        if (cells.length >= 5) upRightDiagonals.push(cells);
    }

    const oldProtected = [...(game.protectedPatterns || [])];
    game.protectedPatterns = [];
    
    // Check if green score exists
    let colors = ["blue", "red"];
    if (game.scores && game.scores.green !== undefined) {
        colors.push("green");
    }

    // Reset scores
    colors.forEach(color => {
        game.scores[color] = 0;
    });

    const checkPatterns = (color) => {
        let totalScore = 0;
        let colorProtected = [];

        const processLine = (line) => {
            let matches = line.map(cell => {
                let effectiveColor = cell.color || (isCornerIndex(cell.index) ? color : null);
                return effectiveColor === color;
            });

            let segments = [];
            let current = [];
            for (let i = 0; i < matches.length; i++) {
                if (matches[i]) {
                    current.push(line[i].index);
                } else {
                    if (current.length >= 5) {
                        segments.push(current);
                    }
                    current = [];
                }
            }
            if (current.length >= 5) {
                segments.push(current);
            }

            for (let segment of segments) {
                let K = segment.length;
                if (K >= 9) {
                    totalScore += 2;
                    colorProtected.push(segment.slice(0, 5));
                    colorProtected.push(segment.slice(K - 5, K));
                } else if (K >= 5) {
                    totalScore += 1;
                    
                    let sliceToProtect = null;
                    for (let i = 0; i <= K - 5; i++) {
                        let slice = segment.slice(i, i + 5);
                        let alreadyProtected = oldProtected.some(p => {
                            return slice.every(val => p.includes(val));
                        });
                        if (alreadyProtected) {
                            sliceToProtect = slice;
                            break;
                        }
                    }
                    if (!sliceToProtect) {
                        sliceToProtect = segment.slice(0, 5);
                    }
                    colorProtected.push(sliceToProtect);
                }
            }
        };

        // 1. Horizontal
        for (let r = 0; r < 10; r++) {
            processLine(board[r]);
        }

        // 2. Vertical
        for (let c = 0; c < 10; c++) {
            let colLine = board.map(row => row[c]);
            processLine(colLine);
        }

        // 3. Diagonals
        downRightDiagonals.forEach(line => processLine(line));
        upRightDiagonals.forEach(line => processLine(line));

        game.scores[color] = totalScore;
        game.protectedPatterns = game.protectedPatterns.concat(colorProtected);
    };

    colors.forEach(color => checkPatterns(color));

    let target = game.targetSequences || 2;
    let winner = Object.keys(game?.scores || {}).find(color => game.scores[color] >= target) || null;
    return { winner, game };
}

function checkForWinner(game, cards) {
    let result = Pattern(game, cards);
    return result;
}

module.exports = {
    initializeGame,
    handleCardSelection,
    Pattern,
    checkForWinner,
};
