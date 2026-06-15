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
    else if (selectedCard > 104 && selectedCard <= 108 && cardInQuestion.selected === "True") {
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
    let board = Array(10).fill(null).map(() => Array(10).fill({ color: null, isPartOfPattern: false, index: -1 }));
    game.protectedPatterns = game.protectedPatterns || [];
    const cornerIndices = [1, 10, 91, 100];

    const getPositionFromId = (id) => {
        let row = Math.floor((id - 1) / 10);
        let col = (id - 1) % 10;
        return { row, col };
    };

    if (Array.isArray(cards)) {
        cards.forEach((card) => {
            if (card.selected === "True") {
                const { row, col } = getPositionFromId(card.id);
                board[row][col] = { color: card.selectedby, isPartOfPattern: false, index: card.id };
            }
        });
    }

    const isCornerIndex = (index) => cornerIndices.includes(index);

    const checkConsecutive = (arr, color) => {
        let count = 0;
        let patternIndices = [];
        for (let i = 0; i < arr.length; i++) {
            let cell = arr[i];
            let effectiveColor = cell.color || (isCornerIndex(cell.index) ? color : null);
            if (effectiveColor == color) {
                count++;
                patternIndices.push(cell.index);
                if (count >= 5) {
                    if (isPatternNew(patternIndices)) {
                        return { isPattern: true, patternIndices };
                    }
                }
            } else {
                count = 0;
                patternIndices = [];
            }
        }
        return { isPattern: false, patternIndices: [] };
    };

    const isPatternNew = (patternIndices) => {
        let existingPatterns = game.protectedPatterns || [];
        let isEntirelyNew = !existingPatterns.some(pattern =>
            patternIndices.every(index => pattern.includes(index))
        );
        let isValidOverlap = existingPatterns.map(pattern =>
            patternIndices.filter(index => pattern.includes(index)).length
        ).every(count => count <= 1);

        return isEntirelyNew && isValidOverlap;
    };

    const addProtectedPattern = (pattern) => {
        game.protectedPatterns = game.protectedPatterns || [];
        game.protectedPatterns.push(pattern);
    };

    const checkPatterns = (color) => {
        const getSequencesOfFive = (arr) => {
            let sequences = [];
            for (let i = 0; i <= arr.length - 5; i++) {
                sequences.push(arr.slice(i, i + 5));
            }
            return sequences;
        };

        const getDownRightDiagonal = (startRow, startCol) => {
            let cells = [];
            for (let i = 0; startRow + i < 10 && startCol + i < 10; i++) {
                cells.push({ ...board[startRow + i][startCol + i], index: (startRow + i) * 10 + startCol + i + 1 });
            }
            return cells;
        };

        const getUpRightDiagonal = (startRow, startCol) => {
            let cells = [];
            for (let i = 0; startRow - i >= 0 && startCol + i < 10; i++) {
                cells.push({ ...board[startRow - i][startCol + i], index: (startRow - i) * 10 + startCol + i + 1 });
            }
            return cells;
        };

        const getDiagonals = (board, getDiagonalCells) => {
            let diagonals = [];
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    let diagonalCells = getDiagonalCells(row, col, board);
                    if (diagonalCells.length >= 5) {
                        diagonals.push(diagonalCells);
                    }
                }
            }
            return diagonals;
        };

        const allDiagonals = [
            ...getDiagonals(board, getDownRightDiagonal),
            ...getDiagonals(board, getUpRightDiagonal)
        ];

        allDiagonals.forEach(diagonal => {
            getSequencesOfFive(diagonal).forEach(sequence => {
                let result = checkConsecutive(sequence, color);
                if (result.isPattern && isPatternNew(result.patternIndices)) {
                    addProtectedPattern(result.patternIndices);
                    game.scores[color] += 1;
                }
            });
        });

        for (let i = 0; i < 10; i++) {
            let row = board[i].map((cell, index) => ({ ...cell, index: i * 10 + index + 1 }));
            getSequencesOfFive(row).forEach(sequence => {
                let rowResult = checkConsecutive(sequence, color);
                if (rowResult.isPattern && isPatternNew(rowResult.patternIndices)) {
                    addProtectedPattern(rowResult.patternIndices);
                    game.scores[color] += 1;
                }
            });

            let col = board.map((_, rowIndex) => board[rowIndex][i]).map((cell, index) => ({ ...cell, index: index * 10 + i + 1 }));
            getSequencesOfFive(col).forEach(sequence => {
                let colResult = checkConsecutive(sequence, color);
                if (colResult.isPattern && isPatternNew(colResult.patternIndices)) {
                    addProtectedPattern(colResult.patternIndices);
                    game.scores[color] += 1;
                }
            });
        }
    };

    let colors = ["blue", "red"];
    if (game.scores.green !== undefined) {
        colors.push("green");
    }

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
