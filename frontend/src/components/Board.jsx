import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cards from "./Cards";
import PlayerDeck from "./PlayerDeck";
import Deck from "./Deck";
import ScoreComponent from "./Score";
import { io } from "socket.io-client";
import PlayerTurn from "./PlayerTurn";
import Swal from "sweetalert2";

const SERVER_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : window.location.origin
);

export default function Boards() {
  const [cards, setCards] = useState([]);
  const [hoveredCard, setHoveredCard] = useState([]);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [greenScore, setGreenScore] = useState(undefined);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(null); // Deprecated
  const [playingAs, setPlayingAs] = useState(null);
  const [yourHand, setYourHand] = useState(null);
  const [deckCount, setDeckCount] = useState(null);
  const [selectCard, setSelectCard] = useState(null);
  const [customRoomId, setCustomRoomId] = useState("");
  const [inCustomGame, setInCustomGame] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [room, setRoom] = useState("");
  
  // New State variables for multi-player and lobby
  const [playersList, setPlayersList] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [playerLimit, setPlayerLimit] = useState(8);
  const [gameMode, setGameMode] = useState("8_players");

  useEffect(() => {
    if (!socket) {
      const newSocket = io(SERVER_URL, { autoConnect: true });
      setSocket(newSocket);
      return () => {
        newSocket.close();
      };
    }
  }, []);

  useEffect(() => {
    if (socket) {
      registerSocketEvents();
      checkForRoomCode();
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("updateGameState", (gameState) => {
        setDeckCount(gameState.deckCount);
        setCards(gameState.cards);
        setYourHand(gameState.playerHand);
        setCurrentPlayerIndex(gameState.currentPlayerIndex);
        setPlayersList(gameState.players || []);
        setBlueScore(gameState.score.blue);
        setRedScore(gameState.score.red);
        if (gameState.score.green !== undefined) {
          setGreenScore(gameState.score.green);
        }
      });
      return () => {
        socket.off("updateGameState");
      };
    }
  }, [socket]);

  const createCustomRoom = useCallback(async () => {
    const result = await inputPlayerName();
    if (!result.isConfirmed) {
      return;
    }
    const username = result.value;
    setPlayerName(username);

    // Swal Selection for Game Mode
    const playerLimitResult = await Swal.fire({
      title: 'Select Game Mode',
      input: 'select',
      inputOptions: {
        '2': '2 Players (2 Teams of 1, Goal: 2 seq)',
        '3': '3 Players (3 Independent, Goal: 1 seq)',
        '4': '4 Players (2 Teams of 2, Goal: 2 seq)',
        '6_teams_3': '6 Players (3 Teams of 2, Goal: 1 seq)',
        '6_teams_2': '6 Players (2 Teams of 3, Goal: 2 seq)',
        '8': '8 Players (2 Teams of 4, Goal: 2 seq)'
      },
      inputValue: '8',
      showCancelButton: true
    });
    if (!playerLimitResult.isConfirmed) {
      return;
    }

    let modeVal = playerLimitResult.value;
    let limit = 8;
    let mode = "8_players";

    if (modeVal === '2') {
      limit = 2;
      mode = "2_players";
    } else if (modeVal === '3') {
      limit = 3;
      mode = "3_players";
    } else if (modeVal === '4') {
      limit = 4;
      mode = "4_players";
    } else if (modeVal === '6_teams_3') {
      limit = 6;
      mode = "6_players_3_teams";
    } else if (modeVal === '6_teams_2') {
      limit = 6;
      mode = "6_players_2_teams";
    } else if (modeVal === '8') {
      limit = 8;
      mode = "8_players";
    }
    
    socket.emit("create_custom_room", { playerName: username, playerLimit: limit, gameMode: mode }, (response) => {
      if (response.roomId) {
        setInCustomGame(true);
        setCustomRoomId(response.roomId);
        setPlayOnline(true);
        setIsWaitingForMatch(true);
        setRoom(`${response.roomId}`);
        navigate(`/room/${response.roomId}`);
      } else {
        console.error("Failed to create custom room.");
      }
    });
  }, [socket, navigate]);

  const joinCustomRoom = useCallback(async (forcedRoomCode = null) => {
    let roomCode = forcedRoomCode;
    if (!roomCode) {
      const roomCodeInput = await Swal.fire({
        title: "Enter the Room ID",
        input: "text",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return "You need to write something!";
          }
        },
      });

      if (!roomCodeInput.isConfirmed) {
        return;
      }
      roomCode = roomCodeInput.value;
    }

    const result = await inputPlayerName();
    if (!result.isConfirmed) {
      return;
    }
    const username = result.value;
    setPlayerName(username);
    setPlayOnline(true);

    socket.emit("join_custom_room", { roomId: roomCode, playerName: username }, (response) => {
      if (response.success) {
        setInCustomGame(true);
        setCustomRoomId(roomCode);
        setRoom(`${roomCode}`);
        navigate(`/room/${roomCode}`);
      } else {
        console.error("Failed to join custom room.");
        Swal.fire("Error", response.message || "Failed to join room.", "error");
      }
    });
  }, [socket, navigate]);

  const onlineButton = useCallback(async () => {
    const result = await inputPlayerName();
    if (!result.isConfirmed) {
      return;
    }
    const username = result.value;
    setPlayerName(username);

    socket.emit("play_online", { playerName: username }, (response) => {
      setPlayOnline(true);
      if (response.roomId) {
        setRoom(`${response.roomId}`);
        navigate(`/room/${response.roomId}`);
      } else if (response.waiting) {
        setIsWaitingForMatch(true);
        setRoom(`${response.waitingroom}`);
        navigate(`/room/${response.waitingroom}`);
      }
    });
  }, [socket, navigate]);

  const inputPlayerName = useCallback(async () => {
    return await Swal.fire({
      title: "Enter your Name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });
  }, []);

  const registerSocketEvents = useCallback(() => {
    socket.on("connect", () => {});
    socket.on("OpponentNotFound", () => {
      setOpponentName(false);
    });
    socket.on("OpponentFound", (data) => {
      setIsWaitingForMatch(false);
      setPlayingAs(data.playingAs);
      setOpponentName(data.players[0].name); // Fallback for old component structure
      setYourHand(data.yourHand);
      setDeckCount(data.deckCount);
      setCards(data.cards);
      setPlayersList(data.players || []);
      setCurrentPlayerIndex(data.currentPlayerIndex || 0);
    });
    socket.on("gameOver", (data) => {
      Swal.fire({
        title: `${data.winner.toUpperCase()} Won the game!`,
        icon: "success",
      });
    });
    socket.on("custom_room_created", (data) => {
      setInCustomGame(true);
      setCustomRoomId(data.roomId);
      Swal.fire(`Room created successfully. Room ID: ${data.roomId}`);
    });
    socket.on("custom_room_joined", () => {
      setInCustomGame(true);
      Swal.fire("Joined room successfully.");
    });
    socket.on("room_join_error", (error) => {
      Swal.fire("Error", error.message, "error");
    });
    socket.on("room_update", (data) => {
      setConnectedPlayers(data.players);
      setPlayerLimit(data.playerLimit);
      setGameMode(data.gameMode);
    });

    return () => {
      socket.off("connect");
      socket.off("OpponentNotFound");
      socket.off("OpponentFound");
      socket.off("gameOver");
      socket.off("custom_room_created");
      socket.off("custom_room_joined");
      socket.off("room_join_error");
      socket.off("room_update");
    };
  }, [socket]);

  const checkForRoomCode = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("roomCode");
    if (roomCode) {
      joinCustomRoom(roomCode);
    }
  }, [joinCustomRoom]);

  if (inCustomGame && !playOnline) {
    return (
      <div className="main-bg">
        <div className="buttonContainer">
          <button onClick={createCustomRoom} className="createRoomBtn">
            Create Custom Room
          </button>
          <button onClick={() => joinCustomRoom()} className="joinRoomBtn">
            Join Custom Room
          </button>
        </div>
      </div>
    );
  }

  if (!playOnline && !inCustomGame) {
    return (
      <div className="main-bg">
        <button onClick={onlineButton} className="playOnline">
          Play Online
        </button>
        <button
          onClick={() => setInCustomGame(true)}
          className="playWithFriendsBtn"
        >
          Play with Friends
        </button>
      </div>
    );
  } else if (playOnline && playersList.length === 0 && !inCustomGame && isWaitingForMatch) {
    return (
      <div className="waiting">
        <p>Waiting for an opponent...</p>
      </div>
    );
  } else if (inCustomGame && playersList.length === 0) {
    return (
      <div className="customGameWaiting main-bg text-center text-white p-8">
        <p className="mb-4 text-3xl font-bold">Room ID: {customRoomId}</p>
        <p className="text-xl mb-6">Waiting for friends to join ({connectedPlayers.length} / {playerLimit} connected)...</p>
        <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto text-left border border-cyan-500 shadow-md">
          <h3 className="text-lg font-bold border-b border-gray-600 pb-2 mb-3 text-cyan-400">Connected Players</h3>
          <ul className="list-disc list-inside space-y-2">
            {connectedPlayers.map((player, idx) => (
              <li key={idx} className="text-white font-medium">{player} {idx === 0 ? "(Host)" : ""}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  } else {
    // Game is active! Determine target sequence goal
    let targetGoal = 2;
    if (gameMode === "3_players" || gameMode === "6_players_3_teams") {
      targetGoal = 1;
    }
    return (
      <>
        <div className="game-board relative mx-auto my-8">
          <span className="sequence-text sequence-text-left">SEQUENCE</span>
          <Cards
            roomId={room} 
            socket={socket}
            cards={cards}
            selectCard={selectCard}
            hoveredCard={hoveredCard}
            currentPlayerIndex={currentPlayerIndex}
            playingAs={playingAs}
          />
          <span className="sequence-text sequence-text-right">SEQUENCE</span>
        </div>
        <div className="flex flex-col justify-end items-end relative mr-4 mb-4">
          <Deck deckCount={deckCount} />
          <PlayerDeck
            socket={socket}
            playerHand={yourHand}
            setSelectCard={setSelectCard}
            setHoveredCard={setHoveredCard}
            currentPlayerIndex={currentPlayerIndex}
            playingAs={playingAs}
          />
          <ScoreComponent redScore={redScore} blueScore={blueScore} greenScore={greenScore} targetSequences={targetGoal} />
          <PlayerTurn
            players={playersList}
            currentPlayerIndex={currentPlayerIndex}
            playingAs={playingAs}
          />
        </div>
      </>
    );
  }
}