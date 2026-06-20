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
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: config.corsOptions
});

mongoose.set('bufferCommands', false);
mongoose.connect(config.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const activeSockets = new Map();

// Map of roomId -> bot difficulty for ongoing bot games
const botDifficultyMap = new Map();

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

async function startGameForRoom(roomId, playerSockets, playerNames, gameMode) {
    try {
        // Create session for each human player only
        for (let i = 0; i < playerSockets.length; i++) {
            const playerId = playerSockets[i];
            if (!isBot(playerId)) {
                await createSession(playerId, roomId, i.toString());
                await joinRoom(playerId, roomId);
            }
        }

        await Game.deleteMany({ roomId: roomId });
        let gameInitialState = gameController.initializeGame(allCards, playerSockets, playerNames, gameMode);
        
        let newGame = new Game({
            roomId: roomId,
            players: gameInitialState.players,
            scores: gameInitialState.scores,
            shuffledDeck: gameInitialState.shuffledDeck,
            cards: deepClone(),
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
                    protectedPatterns: newGame.protectedPatterns || []
                });
            }
        });

        // If first player is a bot, trigger its turn
        const firstPlayer = newGame.players[0];
        if (isBot(firstPlayer.socketId)) {
            const difficulty = botDifficultyMap.get(roomId) || 'medium';
            setTimeout(() => triggerBotTurn(roomId, firstPlayer.socketId, difficulty), 1500);
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
                cards: result.game.cards
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
            io.to(roomId).emit('gameOver', { winner: finalWinner });
            botDifficultyMap.delete(roomId);
            return;
        }

        // Send updated state to all human players
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

        // Chain: if next player is also a bot, trigger again after delay
        const nextPlayer = latestGame.players.find(p => p.isTurn);
        if (nextPlayer && isBot(nextPlayer.socketId)) {
            setTimeout(() => triggerBotTurn(roomId, nextPlayer.socketId, difficulty), 1200);
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
                    protectedPatterns: game.protectedPatterns || []
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
                latestGame.players.forEach((player) => {
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
            }

        } catch (err) {
            console.error("Error swapping dead card: ", err);
        }
    });

    socket.on('Boardcardclicked', async (data) => {
        const { roomId, cardId, selectedCard } = data;

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
                'protectedPatterns': updatedGame.game.protectedPatterns
            };
    
            await Game.updateOne({ roomId: roomId }, { $set: updateData });
            
            let latestGame = await Game.findOne({ roomId: roomId });
            if (!latestGame) {
                console.log("Game not found after update: ", roomId);
                return;
            }

            let patternResult = gameController.Pattern(latestGame, latestGame.cards);
            if (patternResult.winner) {
                io.to(roomId).emit('gameOver', { winner: patternResult.winner });
                botDifficultyMap.delete(roomId);
            } else {
                if (patternResult.game) {
                    await Game.updateOne({ roomId: roomId }, { $set: {
                        'scores': patternResult.game.scores,
                        'protectedPatterns': patternResult.game.protectedPatterns
                    }});
                    latestGame = await Game.findOne({ roomId: roomId });
                }

                // Check again for winner after updates
                let target = latestGame.targetSequences || 2;
                let finalWinner = Object.keys(latestGame.scores || {}).find(color => latestGame.scores[color] >= target) || null;
                if (finalWinner) {
                    io.to(roomId).emit('gameOver', { winner: finalWinner });
                    botDifficultyMap.delete(roomId);
                } else {
                    // Send state only to human players
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

                    // If next player is a bot, trigger its turn
                    const nextPlayer = latestGame.players.find(p => p.isTurn);
                    if (nextPlayer && isBot(nextPlayer.socketId)) {
                        const difficulty = botDifficultyMap.get(roomId) || 'medium';
                        setTimeout(() => triggerBotTurn(roomId, nextPlayer.socketId, difficulty), 1200);
                    }
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
        // Handle room closure
    });
});

const PORT = process.env.PORT || config.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});