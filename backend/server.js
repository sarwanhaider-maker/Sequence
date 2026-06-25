const express = require('express');
const mongoose = require("mongoose");
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const allCards = require('./data/allCards.js');
const gameController = require('./controllers/gameController');
const RoomController = require('./controllers/roomController');
const { getBotMove, isBot } = require('./controllers/botController');
const Game = require('./models/Game');
const Room = require('./models/room');
const Session = require('./models/session');
const config = require('./config/config');

dotenv.config();

const app = express();
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: config.corsOptions
});

mongoose.set('bufferCommands', false);
mongoose.connect(config.MONGO_URL)
  .then(async () => {
    console.log('MongoDB connected');
    try {
      await Room.deleteMany({});
      await Game.deleteMany({});
      await Session.deleteMany({});
      console.log('Cleared old rooms, games, and sessions from database.');
    } catch (err) {
      console.error('Error clearing database on startup:', err);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

const activeSockets = new Map();

// Map of roomId -> bot difficulty for ongoing bot games
const botDifficultyMap = new Map();

// Map to hold active turn timeouts for each room
const turnTimers = new Map();

/**
 * Clear the turn timer for a specific room.
 */
function clearTurnTimer(roomId) {
    if (turnTimers.has(roomId)) {
        clearTimeout(turnTimers.get(roomId));
        turnTimers.delete(roomId);
    }
}

/**
 * Start or reset the turn timer for a specific room.
 */
async function startTurnTimer(roomId) {
    clearTurnTimer(roomId);

    try {
        const room = await Room.findOne({ roomId });
        const game = await Game.findOne({ roomId });
        if (!game) return;

        // Find the active player
        const activePlayer = game.players.find(p => p.isTurn);
        if (!activePlayer) return;

        // If the active player is a bot, we don't need a timeout timer
        if (isBot(activePlayer.socketId)) {
            return;
        }

        // Determine turn limit duration
        let turnDuration = 60; // Default fallback
        if (room) {
            if (room.isCustom) {
                turnDuration = 60;
            } else {
                if (room.stakeReward === 1000 || room.stakeReward === 10000) {
                    turnDuration = 45;
                } else {
                    turnDuration = 60;
                }
            }
        }

        console.log(`Setting turn timer for room ${roomId}: ${turnDuration} seconds for player ${activePlayer.name}`);

        const timeoutHandle = setTimeout(async () => {
            console.log(`Turn timed out for player ${activePlayer.name} in room ${roomId}. Auto-playing a card.`);
            await handleTurnTimeout(roomId);
        }, turnDuration * 1000);

        turnTimers.set(roomId, timeoutHandle);
    } catch (err) {
        console.error(`Error in startTurnTimer for room ${roomId}:`, err);
    }
}

/**
 * Force advance the game turn.
 */
async function advanceGameTurn(roomId) {
    clearTurnTimer(roomId);

    try {
        let game = await Game.findOne({ roomId });
        if (!game) return;

        let currentIndex = game.players.findIndex(p => p.isTurn);
        if (currentIndex === -1) return;

        // Move to the next player
        game.players[currentIndex].isTurn = false;
        let nextIndex = (currentIndex + 1) % game.players.length;
        game.players[nextIndex].isTurn = true;

        await Game.updateOne({ roomId }, { $set: { players: game.players } });

        // Retrieve updated game data
        let latestGame = await Game.findOne({ roomId });
        if (!latestGame) return;

        // Broadcast state update to all human players
        latestGame.players.forEach(player => {
            if (!isBot(player.socketId)) {
                io.to(player.socketId).emit('updateGameState', {
                    deckCount: latestGame.shuffledDeck.length,
                    score: latestGame.scores,
                    cards: latestGame.cards,
                    currentPlayerIndex: latestGame.players.findIndex(p => p.isTurn),
                    players: latestGame.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
                    playerHand: player.hand,
                    protectedPatterns: latestGame.protectedPatterns || []
                });
            }
        });

        // If the next player is a bot, trigger the bot turn after a short delay
        const nextPlayer = latestGame.players.find(p => p.isTurn);
        if (nextPlayer && isBot(nextPlayer.socketId)) {
            const difficulty = botDifficultyMap.get(roomId) || 'medium';
            setTimeout(() => triggerBotTurn(roomId, nextPlayer.socketId, difficulty), 1200);
        } else {
            // Otherwise start the turn timer for the next human player
            startTurnTimer(roomId);
        }
    } catch (err) {
        console.error(`Error in advanceGameTurn for room ${roomId}:`, err);
    }
}

/**
 * Automatically plays a random valid move for the player whose turn timed out.
 */
function makeAutoMoveForPlayer(game, activePlayer) {
    // 1. Try to find a normal card with at least one unoccupied matching cell
    const normalCards = activePlayer.hand.filter(c => c.id <= 100);
    const validNormalMoves = [];
    for (const card of normalCards) {
        if (card.matches && card.matches.length > 0) {
            for (const cellId of card.matches) {
                const cell = game.cards[cellId - 1];
                if (cell && cell.selected !== "True") {
                    validNormalMoves.push({ cardId: cellId, selectedCard: card.id });
                }
            }
        }
    }

    if (validNormalMoves.length > 0) {
        // Pick a random valid normal move
        return validNormalMoves[Math.floor(Math.random() * validNormalMoves.length)];
    }

    // 2. If no normal moves, check for Two-Eyed Jack (Wild, ID 101-104)
    const wildCard = activePlayer.hand.find(c => c.id > 100 && c.id <= 104);
    if (wildCard) {
        // Find any unoccupied cell (excluding corners: 1, 10, 91, 100)
        const cornerIndices = [1, 10, 91, 100];
        const unoccupiedCells = game.cards.filter(c => !cornerIndices.includes(c.id) && c.selected !== "True");
        if (unoccupiedCells.length > 0) {
            const randomCell = unoccupiedCells[Math.floor(Math.random() * unoccupiedCells.length)];
            return { cardId: randomCell.id, selectedCard: wildCard.id };
        }
    }

    // 3. Check for One-Eyed Jack (Remover, ID 105-108)
    const removerCard = activePlayer.hand.find(c => c.id > 104 && c.id <= 108);
    if (removerCard) {
        // Find any opponent chip that is not protected (not shielded and not part of a completed sequence/protected pattern)
        const opponentTeamColors = ["red", "blue", "green"].filter(color => color !== activePlayer.team);
        const removableCells = [];
        for (const cell of game.cards) {
            if (cell.selected === "True" && opponentTeamColors.includes(cell.selectedby) && !cell.shielded) {
                // Check if cell is in any protected pattern
                const isProtected = (game.protectedPatterns || []).some(pattern => pattern.includes(cell.id));
                if (!isProtected) {
                    removableCells.push(cell);
                }
            }
        }
        if (removableCells.length > 0) {
            const randomCell = removableCells[Math.floor(Math.random() * removableCells.length)];
            return { cardId: randomCell.id, selectedCard: removerCard.id };
        }
    }

    return null;
}

async function handleTurnTimeout(roomId) {
    clearTurnTimer(roomId);

    try {
        let game = await Game.findOne({ roomId });
        if (!game) return;

        let currentIndex = game.players.findIndex(p => p.isTurn);
        if (currentIndex === -1) return;

        let activePlayer = game.players[currentIndex];

        // 1. Determine a random valid move
        const move = makeAutoMoveForPlayer(game, activePlayer);
        if (!move) {
            console.log(`No valid move for timeout player ${activePlayer.name} — discarding first card.`);
            if (activePlayer.hand.length > 0) {
                activePlayer.hand.splice(0, 1);
                if (game.shuffledDeck.length > 0) {
                    const newCard = game.shuffledDeck.shift();
                    activePlayer.hand.push(newCard);
                }
            }
            await Game.updateOne({ roomId }, { $set: { players: game.players, shuffledDeck: game.shuffledDeck } });
            await advanceGameTurn(roomId);
            return;
        }

        // 2. Play the card and update the board
        const result = gameController.handleCardSelection(
            game, move.cardId, game.shuffledDeck, game.cards, activePlayer.socketId, move.selectedCard
        );
        if (!result.success) {
            console.error(`Auto-play move failed: ${result.message} — discarding card.`);
            if (activePlayer.hand.length > 0) {
                activePlayer.hand.splice(0, 1);
                if (game.shuffledDeck.length > 0) {
                    const newCard = game.shuffledDeck.shift();
                    activePlayer.hand.push(newCard);
                }
            }
            await Game.updateOne({ roomId }, { $set: { players: game.players, shuffledDeck: game.shuffledDeck } });
            await advanceGameTurn(roomId);
            return;
        }

        // Save selection updates
        await Game.updateOne({ roomId }, { $set: {
            players: result.game.players,
            shuffledDeck: result.game.shuffledDeck,
            cards: result.game.cards,
            lastMove: result.game.lastMove
        }});

        let latestGame = await Game.findOne({ roomId });
        if (!latestGame) return;

        // 3. Scan for completed sequences (patterns)
        let patternResult = gameController.Pattern(latestGame, latestGame.cards);
        if (patternResult.game) {
            await Game.updateOne({ roomId }, { $set: {
                scores: patternResult.game.scores,
                protectedPatterns: patternResult.game.protectedPatterns
            }});
            latestGame = await Game.findOne({ roomId });
        }

        // 4. Check if we have a winner
        const target = latestGame.targetSequences || 2;
        const winner = Object.keys(latestGame.scores || {}).find(c => latestGame.scores[c] >= target);
        const finalWinner = winner || patternResult.winner;

        if (finalWinner) {
            broadcastGameState(latestGame);
            io.to(roomId).emit('gameOver', { winner: finalWinner });
            botDifficultyMap.delete(roomId);
            return;
        }

        // 5. Send state updates to human players
        broadcastGameState(latestGame);

        // 6. Chain turn logic
        const nextPlayer = latestGame.players.find(p => p.isTurn);
        if (nextPlayer && isBot(nextPlayer.socketId)) {
            const difficulty = botDifficultyMap.get(roomId) || 'medium';
            setTimeout(() => triggerBotTurn(roomId, nextPlayer.socketId, difficulty), 1200);
        } else {
            startTurnTimer(roomId);
        }

    } catch (err) {
        console.error(`Error in handleTurnTimeout for room ${roomId}:`, err);
    }
}

function deepClone() {
    let filteredCards = allCards.filter(card => card.id <= 100);
    return JSON.parse(JSON.stringify(filteredCards));
}

async function joinRoom(socketId, roomId) {
    const session = await Session.findOne({ userId: socketId });
    if (session) {
      session.roomId = roomId;
      await session.save();
    }
}

async function createSession(socketId, roomId = null, playingAs = "") {
    const expirationTime = new Date(new Date().getTime() + (2 * 60 * 60 * 1000));
    const newSession = new Session({  
        userId: socketId,    
        roomId: roomId,    
        playingAs: playingAs,
        expiresAt: expirationTime
    });

    try {
        await newSession.save();
        console.log(`New session created for socket ${socketId} with expiration at ${expirationTime}`);
        return socketId;
    } catch (err) {
        console.error('Failed to save session:', err);
        return null;
    }
}

async function initializeGameForRoom(roomId, playerName, playerId) {
    // Stub function required by RoomController signature
}

function generateGameBoardCards(boardType) {
    let standardCards = JSON.parse(JSON.stringify(allCards.filter(c => c.id <= 100)));
    
    if (boardType === "SHUFFLED") {
        const cornerIds = [1, 10, 91, 100];
        let nonCorners = standardCards.filter(c => !cornerIds.includes(c.id));
        
        let codesAndImgs = nonCorners.map(c => ({ code: c.code, img: c.img }));
        
        // Shuffle Fisher-Yates
        for (let i = codesAndImgs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [codesAndImgs[i], codesAndImgs[j]] = [codesAndImgs[j], codesAndImgs[i]];
        }
        
        let nonCornerIdx = 0;
        standardCards = standardCards.map(c => {
            if (cornerIds.includes(c.id)) {
                return c; // Keep corner unchanged
            } else {
                const updated = {
                    ...c,
                    code: codesAndImgs[nonCornerIdx].code,
                    img: codesAndImgs[nonCornerIdx].img,
                    matches: []
                };
                nonCornerIdx++;
                return updated;
            }
        });
        
        // Recompute matches
        standardCards.forEach(card => {
            if (card.code !== "Free") {
                let matches = [];
                standardCards.forEach(other => {
                    if (other.code === card.code) {
                        matches.push(other.id);
                    }
                });
                card.matches = matches;
            }
        });
    }
    
    return standardCards;
}

function broadcastGameState(game) {
    game.players.forEach(player => {
        if (!isBot(player.socketId)) {
            io.to(player.socketId).emit('updateGameState', {
                deckCount: game.shuffledDeck.length,
                score: game.scores,
                cards: game.cards,
                currentPlayerIndex: game.players.findIndex(p => p.isTurn),
                players: game.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
                playerHand: player.hand,
                protectedPatterns: game.protectedPatterns || [],
                lastMove: game.lastMove || null
            });
        }
    });
}

async function startGameForRoom(roomId, playerSockets, playerNames, gameMode) {
    try {
        if (!botDifficultyMap.has(roomId) && playerSockets.some(isBot)) {
            botDifficultyMap.set(roomId, 'medium');
        }
        // Create session for each human player only
        for (let i = 0; i < playerSockets.length; i++) {
            const playerId = playerSockets[i];
            if (!isBot(playerId)) {
                await createSession(playerId, roomId, i.toString());
                await joinRoom(playerId, roomId);
            }
        }

        const room = await Room.findOne({ roomId: roomId });
        const boardType = room ? room.boardType : "STANDARD";

        const gameBoardCards = generateGameBoardCards(boardType);
        const jackCards = JSON.parse(JSON.stringify(allCards.filter(c => c.id > 100)));
        const deckSource = [...gameBoardCards, ...jackCards];

        await Game.deleteMany({ roomId: roomId });
        let gameInitialState = gameController.initializeGame(deckSource, playerSockets, playerNames, gameMode);
        
        let newGame = new Game({
            roomId: roomId,
            players: gameInitialState.players,
            scores: gameInitialState.scores,
            shuffledDeck: gameInitialState.shuffledDeck,
            cards: gameBoardCards,
            protectedPatterns: [],
            targetSequences: gameInitialState.targetSequences
        });
    
        await newGame.save();
        console.log(`Game started in room ${roomId}. Players count: ${playerSockets.length}, mode: ${gameMode}`);

        newGame.players.forEach(player => {
            if (!isBot(player.socketId)) {
                io.to(player.socketId).emit('OpponentFound', {
                    yourHand: player.hand,
                    playingAs: player.index,
                    deckCount: newGame.shuffledDeck.length,
                    cards: newGame.cards,
                    players: newGame.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
                    currentPlayerIndex: 0,
                    protectedPatterns: newGame.protectedPatterns || [],
                    lastMove: null
                });
            }
        });

        // If first player is a bot, trigger its turn
        const firstPlayer = newGame.players[0];
        if (isBot(firstPlayer.socketId)) {
            const difficulty = botDifficultyMap.get(roomId) || 'medium';
            setTimeout(() => triggerBotTurn(roomId, firstPlayer.socketId, difficulty), 1500);
        } else {
            startTurnTimer(roomId);
        }
    } catch (err) {
        console.error(`Error starting game for room ${roomId}:`, err);
    }
}

const roomController = new RoomController(io, initializeGameForRoom, startGameForRoom);

/**
 * Trigger a bot's turn automatically.
 */
async function triggerBotTurn(roomId, botSocketId, difficulty) {
    clearTurnTimer(roomId);
    try {
        let game = await Game.findOne({ roomId });
        if (!game) return;

        // Verify it's still this bot's turn
        const currentPlayer = game.players.find(p => p.isTurn);
        if (!currentPlayer || currentPlayer.socketId !== botSocketId) return;

        // Discard and replace any dead cards in bot's hand
        let hasSwappedDeadCard = true;
        while (hasSwappedDeadCard) {
            hasSwappedDeadCard = false;
            for (let i = 0; i < currentPlayer.hand.length; i++) {
                const cardObj = currentPlayer.hand[i];
                const isDead = cardObj.matches && cardObj.matches.length > 0 && cardObj.matches.every(cellId => {
                    const cell = game.cards[cellId - 1];
                    return cell && cell.selected === "True";
                });
                if (isDead) {
                    currentPlayer.hand.splice(i, 1);
                    if (game.shuffledDeck.length > 0) {
                        let newCard = game.shuffledDeck.shift();
                        currentPlayer.hand.push(newCard);
                    }
                    hasSwappedDeadCard = true;
                    break;
                }
            }
        }

        const move = getBotMove(game, game.cards, difficulty, botSocketId);
        if (!move) {
            console.log(`Bot ${botSocketId} has no valid move — skipping turn.`);
            // Force advance turn
            const idx = game.players.findIndex(p => p.socketId === botSocketId);
            game.players[idx].isTurn = false;
            game.players[(idx + 1) % game.players.length].isTurn = true;
            await game.save();
        } else {
            const result = gameController.handleCardSelection(
                game, move.cardId, game.shuffledDeck, game.cards, botSocketId, move.selectedCard
            );
            if (!result.success) {
                console.error(`Bot move failed: ${result.message}`);
                return;
            }

            await Game.updateOne({ roomId }, { $set: {
                players: result.game.players,
                shuffledDeck: result.game.shuffledDeck,
                cards: result.game.cards,
                lastMove: result.game.lastMove
            }});
        }

        let latestGame = await Game.findOne({ roomId });
        if (!latestGame) return;

        let patternResult = gameController.Pattern(latestGame, latestGame.cards);
        if (patternResult.game) {
            await Game.updateOne({ roomId }, { $set: {
                scores: patternResult.game.scores,
                protectedPatterns: patternResult.game.protectedPatterns
            }});
            latestGame = await Game.findOne({ roomId });
        }

        const target = latestGame.targetSequences || 2;
        const winner = Object.keys(latestGame.scores || {}).find(c => latestGame.scores[c] >= target);

        if (winner || patternResult.winner) {
            const finalWinner = winner || patternResult.winner;
            broadcastGameState(latestGame);
            io.to(roomId).emit('gameOver', { winner: finalWinner });
            botDifficultyMap.delete(roomId);
            return;
        }

        // Send updated state to all human players
        broadcastGameState(latestGame);

        // Chain: if next player is also a bot, trigger again after delay
        const nextPlayer = latestGame.players.find(p => p.isTurn);
        if (nextPlayer && isBot(nextPlayer.socketId)) {
            setTimeout(() => triggerBotTurn(roomId, nextPlayer.socketId, difficulty), 1200);
        } else {
            startTurnTimer(roomId);
        }
    } catch (err) {
        console.error(`Error in triggerBotTurn for room ${roomId}:`, err);
    }
}

io.on("connection", async (socket) => {
    let sessionID = socket.handshake.query.sessionId;
    console.log(`Connection: ${socket.id}, sessionId: ${sessionID}`);
    
    if (sessionID) {
        const existingSocket = activeSockets.get(sessionID);
        if (existingSocket) {
            existingSocket.disconnect();
            activeSockets.delete(sessionID);
        }
        activeSockets.set(sessionID, socket);
        console.log(`Reconnected client ${sessionID}`);

        const existingSession = await Session.findOne({ userId: sessionID });
        if (existingSession) {
            const roomId = existingSession.roomId;
            const playerId = existingSession.userId;
            const playingAs = parseInt(existingSession.playingAs);
            
            let game = await Game.findOne({ roomId: roomId });
            if (game && !isNaN(playingAs) && playingAs >= 0 && playingAs < game.players.length) {
                // Update player's socket ID to new socket ID
                game.players[playingAs].socketId = socket.id;
                await game.save();

                socket.join(roomId);
                socket.emit('OpponentFound', {
                    yourHand: game.players[playingAs].hand,
                    playingAs: playingAs,
                    deckCount: game.shuffledDeck.length,
                    cards: game.cards,
                    players: game.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
                    currentPlayerIndex: game.players.findIndex(p => p.isTurn),
                    protectedPatterns: game.protectedPatterns || [],
                    lastMove: game.lastMove || null
                });
            }
        }
    } else {
        console.log(`New connection: ${socket.id}`);
        const newSessionID = await createSession(socket.id);
        activeSockets.set(newSessionID, socket);
    }

    socket.on('deadCardClicked', async (data) => {
        const { roomId, cardId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) {
                console.log("Game not found for room: ", roomId);
                return;
            }

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to swap dead card");
                return;
            }

            // Verify the card is actually in player's hand
            let cardIndexInHand = currentPlayer.hand.findIndex(c => c.id === cardId);
            if (cardIndexInHand === -1) {
                console.log("Card not in hand");
                return;
            }

            let cardObj = currentPlayer.hand[cardIndexInHand];

            const isDead = cardObj.matches && cardObj.matches.length > 0 && cardObj.matches.every(cellId => {
                const cell = game.cards[cellId - 1];
                return cell && cell.selected === "True";
            });

            if (!isDead) {
                console.log("Card is not dead");
                return;
            }

            // Remove dead card from hand and draw new one
            currentPlayer.hand.splice(cardIndexInHand, 1);
            if (game.shuffledDeck.length > 0) {
                let newCard = game.shuffledDeck.shift();
                currentPlayer.hand.push(newCard);
            }

            // Save the game state without advancing the turn
            let updateData = {
                'players': game.players,
                'shuffledDeck': game.shuffledDeck
            };

            await Game.updateOne({ roomId: roomId }, { $set: updateData });

            // Fetch and emit updated game state
            let latestGame = await Game.findOne({ roomId: roomId });
            if (latestGame) {
                broadcastGameState(latestGame);
            }

        } catch (err) {
            console.error("Error swapping dead card: ", err);
        }
    });

    socket.on('use_booster_shield', async (data) => {
        const { roomId, cardId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) return;

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to use booster");
                return;
            }

            let cardIndex = cardId - 1;
            let cardObj = game.cards[cardIndex];
            if (cardObj && cardObj.selected === "True" && cardObj.selectedby === currentPlayer.team) {
                cardObj.shielded = true;
                
                await Game.updateOne({ roomId: roomId }, { $set: { cards: game.cards } });

                let latestGame = await Game.findOne({ roomId: roomId });
                if (latestGame) {
                    broadcastGameState(latestGame);
                }
            }
        } catch (err) {
            console.error("Error using shield booster: ", err);
        }
    });

    socket.on('use_booster_wild_upgrade', async (data) => {
        const { roomId, handCardId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) return;

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to use booster");
                return;
            }

            let cardIndex = currentPlayer.hand.findIndex(c => c.id === handCardId);
            if (cardIndex !== -1) {
                currentPlayer.hand[cardIndex] = {
                    id: 101, // Two-Eyed Jack ID
                    img: "../assests/JD.png",
                    selected: false,
                    matches: [],
                    isUpgradedWild: true
                };

                await Game.updateOne({ roomId: roomId }, { $set: { players: game.players } });

                let latestGame = await Game.findOne({ roomId: roomId });
                if (latestGame) {
                    broadcastGameState(latestGame);
                }
            }
        } catch (err) {
            console.error("Error using wild upgrade booster: ", err);
        }
    });

    socket.on('use_booster_reroll', async (data) => {
        const { roomId, handCardId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) return;

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to use booster");
                return;
            }

            let cardIndex = currentPlayer.hand.findIndex(c => c.id === handCardId);
            if (cardIndex !== -1 && game.shuffledDeck.length > 0) {
                let discardedCard = currentPlayer.hand[cardIndex];
                
                let newCard = game.shuffledDeck.shift();
                currentPlayer.hand[cardIndex] = newCard;

                game.shuffledDeck.push(discardedCard);

                await Game.updateOne({ roomId: roomId }, { $set: { players: game.players, shuffledDeck: game.shuffledDeck } });

                let latestGame = await Game.findOne({ roomId: roomId });
                if (latestGame) {
                    broadcastGameState(latestGame);
                }
            }
        } catch (err) {
            console.error("Error using re-roll booster: ", err);
        }
    });

    socket.on('use_booster_spy', async (data) => {
        const { roomId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) return;

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to use booster");
                return;
            }

            // Find the opponent player
            let opponentPlayer = game.players.find(p => p.socketId !== socket.id);
            if (opponentPlayer) {
                // Send opponent's hand to the active player privately
                socket.emit('booster_spy_result', { opponentHand: opponentPlayer.hand });
                
                // Notify the opponent that a spying glass was used on them
                socket.to(opponentPlayer.socketId).emit('booster_spy_notification', {
                    message: `${currentPlayer.name} used Spying Glass on you!`
                });
            }
        } catch (err) {
            console.error("Error using spy booster: ", err);
        }
    });

    socket.on('use_booster_emp', async (data) => {
        const { roomId, cardId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) return;

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to use booster");
                return;
            }

            let cardIndex = cardId - 1;
            let cardObj = game.cards[cardIndex];
            if (cardObj && cardObj.selected === "True" && cardObj.selectedby !== currentPlayer.team && cardObj.shielded) {
                cardObj.shielded = false; // Remove shield
                
                await Game.updateOne({ roomId: roomId }, { $set: { cards: game.cards } });

                let latestGame = await Game.findOne({ roomId: roomId });
                if (latestGame) {
                    broadcastGameState(latestGame);
                }
            }
        } catch (err) {
            console.error("Error using emp booster: ", err);
        }
    });

    socket.on('use_booster_hand_exchange', async (data) => {
        const { roomId, handCardId } = data;
        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) return;

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId) {
                console.log("Not this player's turn to use booster");
                return;
            }

            // Find opponent
            let opponentIndex = game.players.findIndex(p => p.socketId !== socket.id);
            if (opponentIndex === -1) return;
            let opponentPlayer = game.players[opponentIndex];

            // Find selected card in current player's hand
            let currentCardIndex = currentPlayer.hand.findIndex(c => c.id === handCardId);
            if (currentCardIndex !== -1 && opponentPlayer.hand.length > 0) {
                let randomOpponentIndex = Math.floor(Math.random() * opponentPlayer.hand.length);
                
                // Swap the two cards
                let currentCard = currentPlayer.hand[currentCardIndex];
                let opponentCard = opponentPlayer.hand[randomOpponentIndex];

                currentPlayer.hand[currentCardIndex] = opponentCard;
                opponentPlayer.hand[randomOpponentIndex] = currentCard;

                await Game.updateOne({ roomId: roomId }, { $set: { players: game.players } });

                let latestGame = await Game.findOne({ roomId: roomId });
                if (latestGame) {
                    broadcastGameState(latestGame);
                }

                // Send private swap feedback messages
                socket.emit('booster_effect_msg', { text: `You swapped your card for opponent's ${opponentCard.id > 100 ? 'Jack' : 'Card'}!` });
                socket.to(opponentPlayer.socketId).emit('booster_effect_msg', { text: `Opponent swapped a card with your hand!` });
            }
        } catch (err) {
            console.error("Error using hand exchange booster: ", err);
        }
    });

    socket.on('Boardcardclicked', async (data) => {
        const { roomId, cardId, selectedCard } = data;
        clearTurnTimer(roomId);

        try {
            let game = await Game.findOne({ roomId: roomId });
            if (!game) {
                console.log("Game not found for room: ", roomId);
                return;
            }

            let currentTurnIndex = game.players.findIndex(p => p.isTurn);
            let currentPlayer = game.players[currentTurnIndex];
            if (socket.id !== currentPlayer.socketId || !currentPlayer.hand.some(card => card.id === selectedCard)) {
                console.log("Not this player's turn or invalid card manipulation");
                return;
            }
            let cards = game.cards;

            let updatedGame = gameController.handleCardSelection(game, cardId, game.shuffledDeck, cards, socket.id, selectedCard);
            if (!updatedGame.success) {
                console.log('Error: ', updatedGame.message);
                return;
            }

            let updateData = {
                'players': updatedGame.game.players,
                'scores': updatedGame.game.scores,
                'shuffledDeck': updatedGame.game.shuffledDeck,
                'cards': updatedGame.game.cards,
                'protectedPatterns': updatedGame.game.protectedPatterns,
                'lastMove': updatedGame.game.lastMove
            };
    
            await Game.updateOne({ roomId: roomId }, { $set: updateData });
            
            let latestGame = await Game.findOne({ roomId: roomId });
            if (!latestGame) {
                console.log("Game not found after update: ", roomId);
                return;
            }

            let patternResult = gameController.Pattern(latestGame, latestGame.cards);
            if (patternResult.game) {
                await Game.updateOne({ roomId: roomId }, { $set: {
                    'scores': patternResult.game.scores,
                    'protectedPatterns': patternResult.game.protectedPatterns
                }});
                latestGame = await Game.findOne({ roomId: roomId });
            }

            // Check for winner
            let target = latestGame.targetSequences || 2;
            let finalWinner = patternResult.winner || Object.keys(latestGame.scores || {}).find(color => latestGame.scores[color] >= target) || null;

            if (finalWinner) {
                // Send final state so they see the last chip and protected pattern highlights
                broadcastGameState(latestGame);
                io.to(roomId).emit('gameOver', { winner: finalWinner });
                botDifficultyMap.delete(roomId);
            } else {
                // Send state only to human players
                broadcastGameState(latestGame);

                // If next player is a bot, trigger its turn
                const nextPlayer = latestGame.players.find(p => p.isTurn);
                if (nextPlayer && isBot(nextPlayer.socketId)) {
                    const difficulty = botDifficultyMap.get(roomId) || 'medium';
                    setTimeout(() => triggerBotTurn(roomId, nextPlayer.socketId, difficulty), 1200);
                } else {
                    startTurnTimer(roomId);
                }
            }
        } catch (err) {
            console.error('Error processing Boardcardclicked:', err);
        }
    });

    // Handle bot game start
    socket.on('start_bot_game', async (data, callback) => {
        const { playerName, numBots = 1, difficulty = 'medium' } = data || {};
        if (!playerName) {
            if (typeof callback === 'function') callback({ success: false, message: 'Player name required.' });
            return;
        }

        try {
            // Generate unique room ID
            let roomId;
            let isUnique = false;
            while (!isUnique) {
                roomId = Math.floor(100000 + Math.random() * 900000).toString();
                const existing = await Room.findOne({ roomId });
                isUnique = !existing;
            }

            const clampedBots = Math.max(1, Math.min(3, numBots));
            const totalPlayers = 1 + clampedBots;
            let gameMode = totalPlayers === 2 ? '2_players' : totalPlayers === 3 ? '3_players' : '4_players';

            // Build player lists: human first, then bots
            const playerSockets = [socket.id];
            const playerNames = [playerName];
            for (let i = 0; i < clampedBots; i++) {
                playerSockets.push(`bot_${roomId}_${i}`);
                playerNames.push(`Bot ${i + 1}`);
            }

            // Persist the room
            const newRoom = new Room({
                roomId,
                players: playerSockets,
                isCustom: true,
                empty: false,
                playersName: playerNames,
                playerLimit: totalPlayers,
                gameMode
            });
            await newRoom.save();

            socket.join(roomId);
            botDifficultyMap.set(roomId, difficulty);

            if (typeof callback === 'function') callback({ success: true, roomId });

            await startGameForRoom(roomId, playerSockets, playerNames, gameMode);
        } catch (err) {
            console.error('Error starting bot game:', err);
            if (typeof callback === 'function') callback({ success: false, message: 'Server error.' });
        }
    });

    socket.on('room_closed', roomId => {
        clearTurnTimer(roomId);
    });
});

const PORT = process.env.PORT || config.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});