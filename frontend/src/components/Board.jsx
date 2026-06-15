import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cards from "./Cards";
import PlayerDeck from "./PlayerDeck";
import ScoreComponent from "./Score";
import { io } from "socket.io-client";
import PlayerTurn from "./PlayerTurn";
import Swal from "sweetalert2";

const SERVER_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : window.location.origin
);

class GameSounds {
  static initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  static playChipPlace() {
    try {
      this.initAudio();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  static playWin() {
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const playTone = (freq, time, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playTone(261.63, now, 0.2); // C4
      playTone(329.63, now + 0.12, 0.2); // E4
      playTone(392.00, now + 0.24, 0.2); // G4
      playTone(523.25, now + 0.36, 0.5); // C5
    } catch (e) {
      console.error(e);
    }
  }

  static playLose() {
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const playTone = (freq, time, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playTone(392.00, now, 0.25); // G4
      playTone(311.13, now + 0.15, 0.25); // Eb4
      playTone(261.63, now + 0.3, 0.25); // C4
      playTone(196.00, now + 0.45, 0.6); // G3
    } catch (e) {
      console.error(e);
    }
  }

  static playTurnAlert() {
    try {
      this.initAudio();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.error(e);
    }
  }
}

const countChips = (boardCards) => {
  if (!boardCards) return 0;
  return boardCards.reduce((total, card) => total + (card.color ? 1 : 0), 0);
};

export default function Boards() {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [hoveredCard, setHoveredCard] = useState([]);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [greenScore, setGreenScore] = useState(undefined);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playingAs, setPlayingAs] = useState(null);
  const [yourHand, setYourHand] = useState(null);
  const [deckCount, setDeckCount] = useState(null);
  const [selectCard, setSelectCard] = useState(null);
  const [customRoomId, setCustomRoomId] = useState("");
  const [inCustomGame, setInCustomGame] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [room, setRoom] = useState("");
  
  // Lobby and turn states
  const [playersList, setPlayersList] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [playerLimit, setPlayerLimit] = useState(8);
  const [gameMode, setGameMode] = useState("8_players");
  const [protectedPatterns, setProtectedPatterns] = useState([]);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState(null);

  // Refs for tracking live state inside socket events
  const playingAsRef = useRef(playingAs);
  const playersListRef = useRef(playersList);
  const roomRef = useRef(room);
  const connectedPlayersRef = useRef(connectedPlayers);
  const playerNameRef = useRef(playerName);
  const prevChipsCount = useRef(0);
  const currentPlayerIndexRef = useRef(currentPlayerIndex);
  const customRoomIdRef = useRef(customRoomId);

  useEffect(() => { playingAsRef.current = playingAs; }, [playingAs]);
  useEffect(() => { playersListRef.current = playersList; }, [playersList]);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { connectedPlayersRef.current = connectedPlayers; }, [connectedPlayers]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { currentPlayerIndexRef.current = currentPlayerIndex; }, [currentPlayerIndex]);
  useEffect(() => { customRoomIdRef.current = customRoomId; }, [customRoomId]);

  // Audio Context auto-resume on first user gesture
  useEffect(() => {
    const resumeAudio = () => {
      GameSounds.initAudio();
    };
    window.addEventListener("click", resumeAudio);
    window.addEventListener("touchstart", resumeAudio);
    return () => {
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  // Splash Screen & Wizard States
  const [showSplash, setShowSplash] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Initialize Socket
  useEffect(() => {
    if (!socket) {
      const newSocket = io(SERVER_URL, { autoConnect: true });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setSocketStatus("connected");
        setIsConnected(true);
        setConnectError(null);
      });
      newSocket.on("disconnect", () => {
        setSocketStatus("disconnected");
        setIsConnected(false);
      });
      newSocket.on("connect_error", (err) => {
        setSocketStatus("error");
        setIsConnected(false);
        setConnectError(err.message || err.toString());
      });

      return () => {
        newSocket.close();
      };
    }
  }, []);

  // Fade out splash screen and auto-show wizard
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (!localStorage.getItem("sequence_wizard_seen")) {
        setShowWizard(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen to socket connections
  useEffect(() => {
    if (socket) {
      registerSocketEvents();
    }
  }, [socket]);

  // Sync game state changes
  useEffect(() => {
    if (socket) {
      socket.on("updateGameState", (gameState) => {
        // Play chip placement sound if chip count increases or decreases
        const currentCount = countChips(gameState.cards);
        if (currentCount !== prevChipsCount.current) {
          prevChipsCount.current = currentCount;
          GameSounds.playChipPlace();
        }

        // Play turn alert if it just transitioned to the local player's turn
        const previouslyMyTurn = playingAsRef.current === currentPlayerIndexRef.current;
        const nowMyTurn = playingAsRef.current === gameState.currentPlayerIndex;
        if (!previouslyMyTurn && nowMyTurn) {
          GameSounds.playTurnAlert();
        }

        setDeckCount(gameState.deckCount);
        setCards(gameState.cards);
        setYourHand(gameState.playerHand);
        setCurrentPlayerIndex(gameState.currentPlayerIndex);
        setPlayersList(gameState.players || []);
        setBlueScore(gameState.score.blue);
        setRedScore(gameState.score.red);
        setProtectedPatterns(gameState.protectedPatterns || []);
        if (gameState.score.green !== undefined) {
          setGreenScore(gameState.score.green);
        }
      });
      return () => {
        socket.off("updateGameState");
      };
    }
  }, [socket]);

  // Direct Route Joining Param Sync
  useEffect(() => {
    if (urlRoomId && socket && room !== urlRoomId) {
      const checkAndJoin = () => {
        if (socket.connected) {
          joinCustomRoom(urlRoomId);
        } else {
          socket.once("connect", () => {
            joinCustomRoom(urlRoomId);
          });
        }
      };
      checkAndJoin();
    }
  }, [urlRoomId, socket, room]);

  const registerSocketEvents = useCallback(() => {
    socket.on("connect", () => {});
    socket.on("OpponentNotFound", () => {});
    socket.on("OpponentFound", (data) => {
      Swal.close();
      prevChipsCount.current = countChips(data.cards);
      setIsWaitingForMatch(false);
      setPlayingAs(data.playingAs);
      setYourHand(data.yourHand);
      setDeckCount(data.deckCount);
      setCards(data.cards);
      setPlayersList(data.players || []);
      setCurrentPlayerIndex(data.currentPlayerIndex || 0);
      setProtectedPatterns(data.protectedPatterns || []);

      // If it is our turn on start, play turn alert
      if (data.playingAs === (data.currentPlayerIndex || 0)) {
        GameSounds.playTurnAlert();
      }
    });
    socket.on("gameOver", (data) => {
      const isHost = connectedPlayersRef.current[0] === playerNameRef.current;
      const myTeam = playersListRef.current[playingAsRef.current]?.team || "unknown";

      if (data.winner === myTeam) {
        GameSounds.playWin();
      } else {
        GameSounds.playLose();
      }

      Swal.fire({
        title: `${data.winner.toUpperCase()} Won the game!`,
        text: data.winner === myTeam ? "Congratulations! Your team won!" : "Better luck next time!",
        icon: data.winner === myTeam ? "success" : "error",
        showCancelButton: true,
        confirmButtonText: isHost ? "Play Again" : "Wait for Host",
        cancelButtonText: "Exit to Lobby",
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          if (isHost) {
            socket.emit("play_again", { roomId: roomRef.current });
          } else {
            Swal.fire("Please wait", "Waiting for the host to restart the game...", "info");
          }
        } else {
          socket.emit("leave_room");
          window.location.href = "/";
        }
      });
    });
    socket.on("game_reset_to_lobby", () => {
      setCards([]);
      setYourHand(null);
      setPlayersList([]);
      setPlayOnline(false);
      Swal.close();
      if (customRoomIdRef.current) {
        setInCustomGame(true);
        Swal.fire("Game Stopped", "A player left the game lobby. Returning to waiting lobby...", "info");
      } else {
        setInCustomGame(false);
        Swal.fire("Game Stopped", "A player left the game lobby. Returning to main menu...", "info");
      }
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
      Swal.fire("Error", typeof error === 'string' ? error : error.message || "Join room error", "error");
    });
    socket.on("room_creation_error", (error) => {
      Swal.fire("Error", typeof error === 'string' ? error : error.message || "Failed to create room.", "error");
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
      socket.off("game_reset_to_lobby");
      socket.off("custom_room_created");
      socket.off("custom_room_joined");
      socket.off("room_join_error");
      socket.off("room_creation_error");
      socket.off("room_update");
    };
  }, [socket]);

  const onlineButton = useCallback(async () => {
    if (!socket || !isConnected) {
      Swal.fire("Connection Error", `Not connected to the game server. It is trying to connect to: ${SERVER_URL}\n\nPlease verify that the backend server is running and accessible.`, "error");
      return;
    }
    if (!playerName.trim()) {
      Swal.fire("Error", "Please enter your name first!", "error");
      return;
    }
    socket.emit("play_online", { playerName }, (response) => {
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
  }, [socket, isConnected, navigate, playerName]);

  const createCustomRoom = useCallback(async () => {
    if (!socket || !isConnected) {
      Swal.fire("Connection Error", `Not connected to the game server. It is trying to connect to: ${SERVER_URL}\n\nPlease verify that the backend server is running and accessible.`, "error");
      return;
    }
    if (!playerName.trim()) {
      Swal.fire("Error", "Please enter your name first!", "error");
      return;
    }
    socket.emit("create_custom_room", { playerName, playerLimit, gameMode }, (response) => {
      if (response && response.roomId) {
        setInCustomGame(true);
        setCustomRoomId(response.roomId);
        setPlayOnline(true);
        setRoom(`${response.roomId}`);
        navigate(`/room/${response.roomId}`);
      } else {
        console.error("Failed to create custom room.");
        Swal.fire("Error", "Server failed to respond with room ID. Please try again or check the backend server logs.", "error");
      }
    });
  }, [socket, isConnected, navigate, playerName, playerLimit, gameMode]);

  const joinCustomRoom = useCallback(async (forcedRoomCode = null) => {
    if (!socket || !isConnected) {
      Swal.fire("Connection Error", `Not connected to the game server. It is trying to connect to: ${SERVER_URL}\n\nPlease verify that the backend server is running and accessible.`, "error");
      return;
    }
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

    if (!playerName.trim()) {
      const nameResult = await Swal.fire({
        title: "Enter your Name",
        input: "text",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return "You need to write something!";
          }
        },
      });
      if (!nameResult.isConfirmed) {
        return;
      }
      setPlayerName(nameResult.value);
      emitJoinRoom(roomCode, nameResult.value);
    } else {
      emitJoinRoom(roomCode, playerName);
    }
  }, [socket, navigate, playerName]);

  const emitJoinRoom = (roomCode, name) => {
    setPlayOnline(true);
    socket.emit("join_custom_room", { roomId: roomCode, playerName: name }, (response) => {
      if (response.success) {
        setInCustomGame(true);
        setCustomRoomId(roomCode);
        setRoom(`${roomCode}`);
        navigate(`/room/${roomCode}`);
      } else {
        console.error("Failed to join custom room.");
        setPlayOnline(false);
        Swal.fire("Error", response.message || "Failed to join room.", "error");
      }
    });
  };

  const handleExitRoom = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Your game progress will be lost!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Quit!"
    }).then((result) => {
      if (result.isConfirmed) {
        if (socket) {
          socket.emit("leave_room");
        }
        window.location.href = "/";
      }
    });
  };

  const renderMobileHeader = () => {
    if (playersList.length === 0) return null;
    const activeTeam = playersList[currentPlayerIndex]?.team || "blue";
    const myTeam = playersList[playingAs]?.team || "unknown";
    const activePlayer = playersList[currentPlayerIndex];
    const isMyTurn = playingAs === currentPlayerIndex;

    return (
      <div id="mobile-header" style={{ display: "none", flexDirection: "column", width: "100%", maxWidth: "420px", padding: "8px 12px", background: "var(--panel-bg)", backdropFilter: "blur(15px)", border: "1px solid var(--border-color)", borderRadius: "12px", marginBottom: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", boxSizing: "border-box", flexShrink: 0, gap: "6px" }}>
        {/* Scores Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          {/* Blue Team */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 6px", borderRadius: "6px", border: activeTeam === "blue" ? "1px solid var(--accent-gold)" : "1px solid transparent", boxShadow: activeTeam === "blue" ? "0 0 6px var(--accent-gold)" : "none" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--blue-chip)", border: "1px solid rgba(255,255,255,0.4)" }}></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: "700" }}>Blue</span>
              <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--accent-gold)" }}>{blueScore}</span>
            </div>
          </div>

          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.8rem", fontWeight: "800", color: "#b0a9c9" }}>VS</div>

          {/* Red Team */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 6px", borderRadius: "6px", border: activeTeam === "red" ? "1px solid var(--accent-gold)" : "1px solid transparent", boxShadow: activeTeam === "red" ? "0 0 6px var(--accent-gold)" : "none" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--red-chip)", border: "1px solid rgba(255,255,255,0.4)" }}></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: "700" }}>Red</span>
              <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--accent-gold)" }}>{redScore}</span>
            </div>
          </div>

          {greenScore !== undefined && (
            <>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.8rem", fontWeight: "800", color: "#b0a9c9" }}>VS</div>
              {/* Green Team */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 6px", borderRadius: "6px", border: activeTeam === "green" ? "1px solid var(--accent-gold)" : "1px solid transparent", boxShadow: activeTeam === "green" ? "0 0 6px var(--accent-gold)" : "none" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--green-chip)", border: "1px solid rgba(255,255,255,0.4)" }}></div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: "700" }}>Green</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--accent-gold)" }}>{greenScore}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Info/Status Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "6px", width: "100%", fontSize: "0.75rem" }}>
          {/* Your Team Color Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.7 }}>You:</span>
            <span style={{ 
              color: myTeam === "blue" ? "#3b82f6" : myTeam === "red" ? "#ef4444" : myTeam === "green" ? "#22c55e" : "#b0a9c9",
              fontWeight: "800", 
              textTransform: "uppercase" 
            }}>
              {myTeam} Team
            </span>
            <div style={{ 
              width: "10px", 
              height: "10px", 
              borderRadius: "50%", 
              background: myTeam === "blue" ? "var(--blue-chip)" : myTeam === "red" ? "var(--red-chip)" : myTeam === "green" ? "var(--green-chip)" : "gray" 
            }}></div>
          </div>

          {/* Active Turn Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ opacity: 0.7 }}>Turn:</span>
            {isMyTurn ? (
              <span className="blink-turn" style={{ color: "var(--accent-gold)", fontWeight: "800" }}>YOUR TURN! ⭐</span>
            ) : (
              <span style={{ 
                color: activeTeam === "blue" ? "#3b82f6" : activeTeam === "red" ? "#ef4444" : activeTeam === "green" ? "#22c55e" : "#b0a9c9", 
                fontWeight: "700" 
              }}>
                {activePlayer?.name || "Opponent"}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWizard = () => {
    if (!showWizard) return null;
    return (
      <div id="wizard-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(10, 7, 20, 0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9998 }}>
        <div className="wizard-card" style={{ background: "rgba(25, 20, 45, 0.95)", border: "2px solid var(--border-color)", borderRadius: "20px", width: "90%", maxWidth: "480px", padding: "25px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          
          <img src="/assests/zaesar_logo.png" alt="Zaesar Games Logo" style={{ maxWidth: "110px", height: "auto", marginBottom: "15px", borderRadius: "8px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }} />
          
          <button onClick={() => { setShowWizard(false); localStorage.setItem('sequence_wizard_seen', 'true'); }} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", color: "#b0a9c9", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>Skip</button>

          <div style={{ width: "100%", minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            {wizardStep === 1 && (
              <div className="wizard-step">
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", color: "var(--accent-gold)", marginBottom: "12px", letterSpacing: "1px" }}>Welcome to Sequence</h3>
                <p style={{ color: "#d1cde3", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "15px" }}>
                  A classic board game combining card strategy and chip placement. The objective is to form continuous rows of 5 chips of your color on the board.
                </p>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🏆</div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="wizard-step">
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", color: "var(--accent-cyan)", marginBottom: "12px", letterSpacing: "1px" }}>Playing a Turn</h3>
                <p style={{ color: "#d1cde3", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "15px" }}>
                  Select a card from **YOUR HAND** at the bottom of the screen. Matching board cells will highlight in gold. Click a highlighted cell to place a chip and end your turn.
                </p>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🃏</div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="wizard-step">
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", color: "var(--accent-gold)", marginBottom: "12px", letterSpacing: "1px" }}>Jack Cards Rule</h3>
                <p style={{ color: "#d1cde3", fontSize: "0.9rem", lineHeight: "1.4", marginBottom: "10px", textAlign: "left" }}>
                  👑 **Two-Eyed Jacks (Clubs ♣ / Diamonds ♦)**: Wild! Place a chip on any empty space on the board.
                </p>
                <p style={{ color: "#d1cde3", fontSize: "0.9rem", lineHeight: "1.4", marginBottom: "15px", textAlign: "left" }}>
                  👁️ **One-Eyed Jacks (Spades ♠ / Hearts ♥)**: Removal! Remove any of your opponent's chips (unless protected).
                </p>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="wizard-step">
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", color: "var(--accent-cyan)", marginBottom: "12px", letterSpacing: "1px" }}>Free Corners & Frozen Sequences</h3>
                <p style={{ color: "#d1cde3", fontSize: "0.9rem", lineHeight: "1.4", marginBottom: "10px", textAlign: "left" }}>
                  ⭐ **Corner Cells**: The 4 corners are wild for everyone. You only need 4 chips to form a sequence using a corner.
                </p>
                <p style={{ color: "#d1cde3", fontSize: "0.9rem", lineHeight: "1.4", marginBottom: "15px", textAlign: "left" }}>
                  ❄️ **Frozen Sequences**: Once a sequence of 5 is completed, it is frozen. Its chips cannot be removed. Form **2 sequences** to win!
                </p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", margin: "15px 0" }}>
            {[1, 2, 3, 4].map(step => (
              <span key={step} onClick={() => setWizardStep(step)} className={`wizard-dot ${wizardStep === step ? 'active' : ''}`}></span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "15px", width: "100%", marginTop: "10px" }}>
            {wizardStep > 1 && (
              <button onClick={() => setWizardStep(prev => prev - 1)} className="btn-setup" style={{ flex: 1, margin: 0, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "#fff", padding: "12px", fontSize: "0.95rem", borderRadius: "10px", fontWeight: "600", cursor: "pointer" }}>Previous</button>
            )}
            <button
              onClick={() => {
                if (wizardStep < 4) {
                  setWizardStep(prev => prev + 1);
                } else {
                  setShowWizard(false);
                  localStorage.setItem('sequence_wizard_seen', 'true');
                }
              }}
              className="btn-setup btn-setup-primary"
              style={{ flex: 1, margin: 0, padding: "12px", fontSize: "0.95rem", borderRadius: "10px" }}
            >
              {wizardStep === 4 ? "Got It!" : "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 1. Splash Screen
  if (showSplash) {
    return (
      <div id="splash-screen" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0f0b1e", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
        <div style={{ textAlign: "center", animation: "scaleIn 1.0s ease forwards" }}>
          <img src="/assests/zaesar_logo.png" alt="Zaesar Games Logo" style={{ maxWidth: "240px", height: "auto", marginBottom: "1.5rem", filter: "drop-shadow(0 10px 20px rgba(16, 217, 210, 0.3))", borderRadius: "16px" }} />
          <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--accent-cyan)", letterSpacing: "4px", textTransform: "uppercase", animation: "pulse 1.5s infinite alternate", marginTop: "0.5rem" }}>
            Loading Sequence...
          </div>
        </div>
      </div>
    );
  }

  // 2. Setup Screen / Lobby Choice
  if (!playOnline && !inCustomGame) {
    return (
      <>
        {renderWizard()}
        <div className="flex flex-col items-center justify-center min-h-[85vh] w-full" style={{ animation: "fadeIn 0.5s ease-out" }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "2.2rem", fontWeight: "800", color: "white", textShadow: "0 0 15px rgba(16, 217, 210, 0.5)", margin: "0 0 10px 0", letterSpacing: "6px", textAlign: "center" }}>SEQUENCE</h1>
          
          <div className="setup-container">
            <h2>Online Multiplayer Lobby</h2>
            <div style={{ fontSize: "0.85rem", marginBottom: "15px", opacity: 0.85 }}>
              Server: <span style={{ color: socketStatus === "connected" ? "#4ade80" : "#f87171", fontWeight: "bold" }}>
                {socketStatus === "connected" ? "Connected" : socketStatus === "error" ? "Connection Error" : "Connecting..."}
              </span>
              {connectError && <div style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "4px", fontWeight: "bold" }}>Error: {connectError}</div>}
              <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "2px" }}>({SERVER_URL})</div>
            </div>
            
            <div className="form-group">
              <label htmlFor="pname">Your Name</label>
              <input
                type="text"
                id="pname"
                placeholder="Enter name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gmode">Select Game Mode</label>
              <select
                id="gmode"
                value={gameMode}
                onChange={(e) => {
                  const val = e.target.value;
                  setGameMode(val);
                  if (val === '2_players') setPlayerLimit(2);
                  else if (val === '3_players') setPlayerLimit(3);
                  else if (val === '4_players') setPlayerLimit(4);
                  else if (val === '6_players_3_teams') setPlayerLimit(6);
                  else if (val === '6_players_2_teams') setPlayerLimit(6);
                  else if (val === '8_players') setPlayerLimit(8);
                }}
              >
                <option value="2_players">2 Players (2 Teams of 1, Goal: 2 seq)</option>
                <option value="3_players">3 Players (3 Independent, Goal: 1 seq)</option>
                <option value="4_players">4 Players (2 Teams of 2, Goal: 2 seq)</option>
                <option value="6_players_3_teams">6 Players (3 Teams of 2, Goal: 1 seq)</option>
                <option value="6_players_2_teams">6 Players (2 Teams of 3, Goal: 2 seq)</option>
                <option value="8_players">8 Players (2 Teams of 4, Goal: 2 seq)</option>
              </select>
            </div>

            <button onClick={onlineButton} className="btn-setup btn-setup-primary">
              Quick Match (Play Online)
            </button>
            
            <button onClick={createCustomRoom} className="btn-setup btn-setup-secondary">
              Create Custom Room (Play with Friends)
            </button>

            <button onClick={() => joinCustomRoom()} className="btn-setup" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "#b0a9c9" }}>
              Join Custom Room
            </button>

            <button onClick={() => setShowWizard(true)} className="btn-setup" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "#b0a9c9" }}>
              How to Play
            </button>
          </div>
        </div>
      </>
    );
  }

  // 3. Waiting for Quick Match
  if (playOnline && playersList.length === 0 && !inCustomGame && isWaitingForMatch) {
    return (
      <div className="waiting text-white">
        <p>Waiting for an opponent...</p>
      </div>
    );
  }

  // 4. Custom Room Lobby Waiting for Friends
  if (inCustomGame && playersList.length === 0) {
    const inviteLink = `${window.location.origin}/room/${customRoomId}`;
    const isHost = connectedPlayers[0] === playerName;

    return (
      <div className="customGameWaiting flex flex-col items-center justify-center min-h-[85vh] w-full text-center text-white p-8 animate-[fadeIn_0.5s_ease-out]">
        <p className="mb-4 text-3xl font-bold text-cyan-400">Room ID: {customRoomId}</p>
        <p className="text-xl mb-6">Waiting for friends ({connectedPlayers.length} / {playerLimit} connected)...</p>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              Swal.fire("Copied!", "Invite link copied to clipboard.", "success");
            }}
            className="btn-setup btn-setup-primary"
            style={{ padding: "8px 16px", fontSize: "0.9rem", width: "auto", margin: 0 }}
          >
            Copy Invite Link
          </button>
          
          {isHost && connectedPlayers.length >= 2 && (
            <button
              onClick={() => {
                socket.emit("start_custom_game", { roomId: customRoomId }, (res) => {
                  if (!res.success) {
                    Swal.fire("Error", res.message || "Failed to start game.", "error");
                  }
                });
              }}
              className="btn-setup btn-setup-secondary"
              style={{ padding: "8px 16px", fontSize: "0.9rem", width: "auto", margin: 0 }}
            >
              Start Game
            </button>
          )}
        </div>

        <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-lg max-w-md mx-auto text-left border border-cyan-500/30 shadow-xl w-full">
          <h3 className="text-lg font-bold border-b border-gray-600 pb-2 mb-3 text-cyan-400">Connected Players</h3>
          <ul className="list-disc list-inside space-y-2">
            {connectedPlayers.map((player, idx) => (
              <li key={idx} className="text-white font-medium">{player} {idx === 0 ? "(Host)" : ""}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // 5. Active Game Screen
  let targetGoal = 2;
  if (gameMode === "3_players" || gameMode === "6_players_3_teams") {
    targetGoal = 1;
  }

  return (
    <>
      {renderWizard()}
      <div id="game-screen" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", flex: 1, minHeight: 0 }}>
        {renderMobileHeader()}
        
        <div className="game-layout">
          {/* Left: Cards Grid (Wood container is inside Cards component) */}
          <Cards
            roomId={room} 
            socket={socket}
            cards={cards}
            selectCard={selectCard}
            hoveredCard={hoveredCard}
            currentPlayerIndex={currentPlayerIndex}
            playingAs={playingAs}
            protectedPatterns={protectedPatterns}
          />

          {/* Right: Info & Decks Sidebar */}
          <div className="side-panels">
            {/* Scoreboard Panel */}
            <div className="panel score-status-panel">
              <div className="info-title">
                <span>SCORE BOARD</span>
                <span className="goal-text">GOAL: {targetGoal} SEQ</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.8rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", flexShrink: 0 }}>
                <span style={{ color: "#b0a9c9", fontWeight: "600", textTransform: "uppercase" }}>Deck Remaining:</span>
                <span style={{ fontWeight: "700", color: "var(--accent-cyan)" }}>{deckCount}</span>
              </div>

              {/* Turn display */}
              <div className={`turn-alert turn-${playersList[currentPlayerIndex]?.team || "blue"}`} style={{ fontSize: "0.8rem", padding: "4px", marginBottom: "8px" }}>
                {playingAs === currentPlayerIndex ? "Your Turn" : `${playersList[currentPlayerIndex]?.name || "Opponent"}'s Turn`}
              </div>

              <ScoreComponent redScore={redScore} blueScore={blueScore} greenScore={greenScore} targetSequences={targetGoal} />
            </div>

            {/* Turn List Panel */}
            <PlayerTurn
              players={playersList}
              currentPlayerIndex={currentPlayerIndex}
              playingAs={playingAs}
            />

            {/* Hand Container Panel */}
            <PlayerDeck
              socket={socket}
              playerHand={yourHand}
              setSelectCard={setSelectCard}
              setHoveredCard={setHoveredCard}
              currentPlayerIndex={currentPlayerIndex}
              playingAs={playingAs}
            />

            {/* Quit & Rules Buttons Row */}
            <div className="action-buttons-row" style={{ display: "flex", gap: "8px", marginTop: "auto", flexShrink: 0 }}>
              <button
                onClick={() => setShowWizard(true)}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "#b0a9c9", padding: "8px", fontSize: "0.85rem", fontWeight: "500", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s" }}
              >
                How to Play
              </button>
              <button
                onClick={handleExitRoom}
                className="btn-quit"
                style={{ flex: 1, margin: 0, padding: "8px", fontSize: "0.85rem" }}
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}