const express = require('express');
const mongoose = require("mongoose");
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const allCards = require('./data/allCards.js');
const gameController = require('./controllers/gameController');
const RoomController = require('./controllers/roomController');
const Game = require('./models/Game');
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
        // Create session for each player
        for (let i = 0; i < playerSockets.length; i++) {
            const playerId = playerSockets[i];
            await createSession(playerId, roomId, i.toString());
            await joinRoom(playerId, roomId);
        }

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
            io.to(player.socketId).emit('OpponentFound', {
                yourHand: player.hand,
                playingAs: player.index,
                deckCount: newGame.shuffledDeck.length,
                cards: newGame.cards,
                players: newGame.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
                currentPlayerIndex: 0,
                protectedPatterns: newGame.protectedPatterns || []
            });
        });
    } catch (err) {
        console.error(`Error starting game for room ${roomId}:`, err);
    }
}

const roomController = new RoomController(io, initializeGameForRoom, startGameForRoom);

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
                } else {
                    latestGame.players.forEach(player => {
                        io.to(player.socketId).emit('updateGameState', {
                            deckCount: latestGame.shuffledDeck.length,
                            score: latestGame.scores,
                            cards: latestGame.cards,
                            currentPlayerIndex: latestGame.players.findIndex(p => p.isTurn),
                            players: latestGame.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
                            playerHand: player.hand,
                            protectedPatterns: latestGame.protectedPatterns || []
                        });
                    });
                }
            }
        } catch (err) {
            console.error('Error processing Boardcardclicked:', err);
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