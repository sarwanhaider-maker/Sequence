import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cards from "./Cards";
import PlayerDeck from "./PlayerDeck";
import ScoreComponent from "./Score";
import { io } from "socket.io-client";
import PlayerTurn from "./PlayerTurn";
import Swal from "sweetalert2";

// Import modular Lobby UI components
import LobbyHeader from "./LobbyHeader";
import LobbyBottomNav from "./LobbyBottomNav";
import LobbyHome from "./LobbyHome";
import SettingsModal from "./SettingsModal";
import ProfileModal from "./ProfileModal";
import DailyTasks from "./DailyTasks";
import DailyBonus from "./DailyBonus";
import Store from "./Store";
import StakesCarousel from "./StakesCarousel";
import { useVoiceChat, VoiceChatControls } from "./VoiceChatManager";

const FRIENDS_MODES = [
  { value: "2_players", name: "One Vs One", playersCount: "2 Players", limit: 2, seq: 2, teamFormat: "Solo Match (1v1)", board: "STANDARD" },
  { value: "3_players", name: "One Vs One Vs One", playersCount: "3 Players", limit: 3, seq: 1, teamFormat: "Solo Match (1v1v1)", board: "STANDARD" },
  { value: "4_players", name: "Two Teams", playersCount: "4 Players", limit: 4, seq: 2, teamFormat: "2 Teams (2v2)", board: "STANDARD" },
  { value: "6_players_3_teams", name: "Three Teams", playersCount: "6 Players", limit: 6, seq: 1, teamFormat: "3 Teams (2v2v2)", board: "STANDARD" },
  { value: "6_players_2_teams", name: "Two Teams", playersCount: "6 Players", limit: 6, seq: 2, teamFormat: "2 Teams (3v3)", board: "STANDARD" },
  { value: "8_players", name: "Two Teams", playersCount: "8 Players", limit: 8, seq: 2, teamFormat: "2 Teams (4v4)", board: "STANDARD" }
];

const SERVER_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : window.location.origin
);

class GameSounds {
  static isSoundEnabled() {
    try {
      const saved = localStorage.getItem("seq_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sound !== false;
      }
    } catch (e) {}
    return true;
  }

  static isMusicEnabled() {
    try {
      const saved = localStorage.getItem("seq_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.music !== false;
      }
    } catch (e) {}
    return true;
  }

  static triggerVibration(duration = 100) {
    try {
      const saved = localStorage.getItem("seq_settings");
      let enabled = true;
      if (saved) {
        const parsed = JSON.parse(saved);
        enabled = parsed.vibration !== false;
      }
      if (enabled && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch (e) {}
  }

  static initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Create global music routing chain: lowpass filter -> delay -> destination
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(650, this.ctx.currentTime);
        
        this.delayNode = this.ctx.createDelay(1.0);
        this.delayNode.delayTime.setValueAtTime(0.5, this.ctx.currentTime);
        
        this.feedbackNode = this.ctx.createGain();
        this.feedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
        
        // Connections
        this.filterNode.connect(this.ctx.destination);
        this.filterNode.connect(this.delayNode);
        this.delayNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);
        this.delayNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  static startMusic() {
    if (!this.isMusicEnabled()) {
      this.stopMusic();
      return;
    }
    this.initAudio();
    if (!this.ctx) return;
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    // Beautiful lo-fi chord progression
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // F Maj7 (F3, A3, C4, E4)
      [196.00, 246.94, 293.66, 392.00], // G Maj (G3, B3, D4, G4)
      [164.81, 196.00, 246.94, 293.66], // E min7 (E3, G3, B3, D4)
      [220.00, 261.63, 329.63, 392.00]  // A min7 (A3, C4, E4, G4)
    ];

    // Pentatonic scale arpeggios tailored for each chord
    const melodyScales = [
      [349.23, 392.00, 440.00, 523.25, 659.25, 783.99], // F Pentatonic/Major: F4, G4, A4, C5, E5, G5
      [392.00, 440.00, 493.88, 587.33, 659.25, 783.99], // G Pentatonic/Major: G4, A4, B4, D5, E5, G5
      [329.63, 392.00, 440.00, 493.88, 587.33, 659.25], // E Pentatonic/Minor: E4, G4, A4, B4, D5, E5
      [440.00, 523.25, 587.33, 659.25, 783.99, 880.00]  // A Pentatonic/Minor: A4, C5, D5, E5, G5, A5
    ];

    let chordIndex = 0;

    const playChordLoop = () => {
      if (!this.musicPlaying || !this.isMusicEnabled()) return;
      try {
        const now = this.ctx.currentTime;
        const chordNotes = chords[chordIndex];

        // Play the lush chord notes together with a soft strum delay
        chordNotes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gainNode = this.ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(this.filterNode);

          osc.type = 'triangle'; // Smooth triangle wave
          osc.frequency.setValueAtTime(freq, now);

          // Strum: slightly delay each voice
          const startDelay = idx * 0.1;
          gainNode.gain.setValueAtTime(0, now);
          // Slow rise (attack)
          gainNode.gain.linearRampToValueAtTime(0.02, now + startDelay + 1.5);
          // Exponential decay (release)
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 7.5);

          osc.start(now + startDelay);
          osc.stop(now + startDelay + 8.0);
        });

        // Trigger melody notes during this chord's duration
        // We schedule 4 beats per chord (each beat is 2 seconds apart, total 8 seconds)
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = now + beat * 2.0;
          
          // Random chance to play a note (e.g. 70%)
          if (Math.random() < 0.7) {
            // Delay the note slightly off-beat for a lo-fi human feel
            const humanize = Math.random() * 0.15;
            const noteTime = beatTime + humanize;

            const scale = melodyScales[chordIndex];
            const freq = scale[Math.floor(Math.random() * scale.length)];

            const oscMelody = this.ctx.createOscillator();
            const gainMelody = this.ctx.createGain();
            oscMelody.connect(gainMelody);
            gainMelody.connect(this.filterNode);

            oscMelody.type = 'sine'; // Pure sine tone for clean melody
            oscMelody.frequency.setValueAtTime(freq, noteTime);

            gainMelody.gain.setValueAtTime(0, noteTime);
            gainMelody.gain.linearRampToValueAtTime(0.012, noteTime + 0.08); // Quick attack
            gainMelody.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.8); // Long decay

            oscMelody.start(noteTime);
            oscMelody.stop(noteTime + 2.0);
          }
        }

        // Advance to next chord
        chordIndex = (chordIndex + 1) % chords.length;
      } catch (e) {
        console.error("Music playback error:", e);
      }
      this.musicTimer = setTimeout(playChordLoop, 8000); // 8 seconds per chord cycle
    };

    playChordLoop();
  }

  static stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  static updateMusic() {
    if (this.isMusicEnabled()) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  static playChipPlace() {
    this.triggerVibration(60);
    if (!this.isSoundEnabled()) return;
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
    this.triggerVibration([100, 50, 100, 50, 150]);
    if (!this.isSoundEnabled()) return;
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
    this.triggerVibration(300);
    if (!this.isSoundEnabled()) return;
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
    this.triggerVibration(100);
    if (!this.isSoundEnabled()) return;
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

  // Profile, Coins & Local Persistence
  const [profile, setProfile] = useState(() => {
    let savedPname = localStorage.getItem("seq_pname");
    if (!savedPname) {
      savedPname = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem("seq_pname", savedPname);
    }
    const savedAvatar = parseInt(localStorage.getItem("seq_avatar")) || 0;
    let savedId = localStorage.getItem("seq_id");
    if (!savedId) {
      savedId = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("seq_id", savedId);
    }
    const savedLevel = parseInt(localStorage.getItem("seq_level")) || 1;
    const savedCoins = localStorage.getItem("seq_coins") !== null ? parseInt(localStorage.getItem("seq_coins")) : 75000;
    
    return { name: savedPname, avatarId: savedAvatar, id: savedId, level: savedLevel, coins: savedCoins };
  });

  // Statistics
  const [stats, setStats] = useState(() => {
    const defaultStats = { gamesPlayed: 0, gamesWon: 0, sequencesMade: 0, winnings: 0, winStreak: 0 };
    const saved = localStorage.getItem("seq_stats");
    return saved ? JSON.parse(saved) : defaultStats;
  });

  useEffect(() => {
    localStorage.setItem("seq_stats", JSON.stringify(stats));
  }, [stats]);

  // Daily Tasks
  const [tasks, setTasks] = useState(() => {
    const defaultTasks = [
      { id: 1, text: "Play 5 Games in Online Multiplayer Mode", reward: 1000, current: 0, target: 5, claimed: false },
      { id: 2, text: "Win 3 Games in Online Multiplayer Mode", reward: 1000, current: 0, target: 3, claimed: false },
      { id: 3, text: "Win 10,000 Coins in Play With Friends Mode", reward: 10000, current: 0, target: 10000, claimed: false },
      { id: 4, text: "Win 3 Games in Play With Friends Mode", reward: 1000, current: 0, target: 3, claimed: false },
      { id: 5, text: "Win 10,000 Coins in Online Multiplayer Mode", reward: 10000, current: 0, target: 10000, claimed: false }
    ];
    const saved = localStorage.getItem("seq_tasks");
    return saved ? JSON.parse(saved) : defaultTasks;
  });

  useEffect(() => {
    localStorage.setItem("seq_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Daily Bonus / Login claim state
  const [claimedDays, setClaimedDays] = useState(() => {
    const saved = localStorage.getItem("seq_claimed_days");
    return saved ? JSON.parse(saved) : {};
  });
  const [lastClaimTime, setLastClaimTime] = useState(() => {
    return parseInt(localStorage.getItem("seq_last_claim_time")) || 0;
  });

  useEffect(() => {
    localStorage.setItem("seq_claimed_days", JSON.stringify(claimedDays));
  }, [claimedDays]);
  useEffect(() => {
    localStorage.setItem("seq_last_claim_time", lastClaimTime.toString());
  }, [lastClaimTime]);

  // Settings
  const [gameSettings, setGameSettings] = useState(() => {
    const defaultSettings = { music: true, sound: true, vibration: true, theme: "classic" };
    const saved = localStorage.getItem("seq_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("seq_settings", JSON.stringify(gameSettings));
  }, [gameSettings]);

  // Synchronize active theme to the document body class
  useEffect(() => {
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    const currentTheme = gameSettings.theme || "classic";
    document.body.classList.add(`theme-${currentTheme}`);
  }, [gameSettings.theme]);

  // Lobby navigation and modal states
  const [activeTab, setActiveTab] = useState("HOME");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [stakesOpen, setStakesOpen] = useState(false);
  const [activeStake, setActiveStake] = useState(null);

  // Hovered card ID state for card-specific board dimming
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const updateCoins = (amount) => {
    setProfile(prev => {
      const newCoins = Math.max(0, prev.coins + amount);
      localStorage.setItem("seq_coins", newCoins.toString());
      return { ...prev, coins: newCoins };
    });
  };

  const [cards, setCards] = useState([]);
  const [hoveredCard, setHoveredCard] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [greenScore, setGreenScore] = useState(undefined);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState(profile.name);
  const [playingAs, setPlayingAs] = useState(null);
  const [yourHand, setYourHand] = useState(null);
  const [deckCount, setDeckCount] = useState(null);
  const [selectCard, setSelectCard] = useState(null);
  const [customRoomId, setCustomRoomId] = useState("");
  const [inCustomGame, setInCustomGame] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [room, setRoom] = useState("");
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [lobbyVoiceChat, setLobbyVoiceChat] = useState(false);
  
  // Lobby and turn states
  const [playersList, setPlayersList] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [playerLimit, setPlayerLimit] = useState(2);
  const [gameMode, setGameMode] = useState("2_players");
  const [friendsTouchStart, setFriendsTouchStart] = useState(null);
  const [friendsTouchEnd, setFriendsTouchEnd] = useState(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState(60);

  const handleSelectFriendsMode = (index) => {
    const mode = FRIENDS_MODES[index];
    setGameMode(mode.value);
    setPlayerLimit(mode.limit);
  };

  const handleNextFriendsMode = () => {
    const curIdx = FRIENDS_MODES.findIndex(m => m.value === gameMode);
    const nextIdx = (curIdx + 1) % FRIENDS_MODES.length;
    handleSelectFriendsMode(nextIdx);
  };

  const handlePrevFriendsMode = () => {
    const curIdx = FRIENDS_MODES.findIndex(m => m.value === gameMode);
    const prevIdx = (curIdx - 1 + FRIENDS_MODES.length) % FRIENDS_MODES.length;
    handleSelectFriendsMode(prevIdx);
  };

  const handleFriendsTouchStart = (e) => {
    setFriendsTouchEnd(null);
    setFriendsTouchStart(e.targetTouches[0].clientX);
  };

  const handleFriendsTouchMove = (e) => {
    setFriendsTouchEnd(e.targetTouches[0].clientX);
  };

  const handleFriendsTouchEnd = () => {
    if (!friendsTouchStart || !friendsTouchEnd) return;
    const distance = friendsTouchStart - friendsTouchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      handleNextFriendsMode();
    } else if (distance < -minSwipeDistance) {
      handlePrevFriendsMode();
    }
  };

  const activeFriendsModeIdx = FRIENDS_MODES.findIndex(m => m.value === gameMode);
  const activeFriendsMode = FRIENDS_MODES[activeFriendsModeIdx !== -1 ? activeFriendsModeIdx : 0];

  const [protectedPatterns, setProtectedPatterns] = useState([]);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState(null);

  // Boosters state & logic
  const getInitialBoosters = () => {
    const saved = localStorage.getItem("seq_boosters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { shield: 0, wildUpgrade: 0, reroll: 0 };
  };

  const [boosters, setBoosters] = useState(getInitialBoosters());
  const [usedBoosters, setUsedBoosters] = useState({ shield: false, wildUpgrade: false, reroll: false });
  const [boosterMode, setBoosterMode] = useState(null); // 'shield' | 'wildUpgrade' | 'reroll' | null

  useEffect(() => {
    setBoosters(getInitialBoosters());
    if (!playOnline && !inCustomGame) {
      setUsedBoosters({ shield: false, wildUpgrade: false, reroll: false });
      setBoosterMode(null);
    }
  }, [activeTab, playOnline, inCustomGame]);

  const handleActivateBooster = (type) => {
    if (playingAs !== currentPlayerIndex) {
      Swal.fire({
        title: "Not Your Turn!",
        text: "You can only use tactic cards on your turn.",
        icon: "warning",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
      return;
    }

    if (usedBoosters[type]) {
      Swal.fire({
        title: "Already Used!",
        text: "You can only use each tactic card once per game.",
        icon: "warning",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
      return;
    }

    if ((boosters[type] || 0) <= 0) {
      Swal.fire({
        title: "No Tactic Cards!",
        text: "You do not own this tactic card. Purchase it in the Store first!",
        icon: "warning",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
      return;
    }

    if (boosterMode === type) {
      setBoosterMode(null);
      return;
    }

    setBoosterMode(type);

    let msg = "";
    if (type === 'shield') msg = "Select one of your chips on the board to shield it.";
    if (type === 'wildUpgrade') msg = "Select a card in your hand to turn it into a Wild card.";
    if (type === 'reroll') msg = "Select a card in your hand to redraw/exchange it.";

    Swal.fire({
      title: `${type === 'shield' ? '🛡️ Chip Guard' : type === 'wildUpgrade' ? '🃏 Wild Upgrade' : '🔄 Card Redraw'} Mode Active`,
      text: msg,
      icon: "info",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3500,
      background: '#1a123a',
      color: '#fff'
    });
  };

  const { connected: voiceConnected, muted: voiceMuted, toggleMute: toggleVoiceMute, error: voiceError } = useVoiceChat(
    room,
    playerName,
    voiceChatEnabled,
    socket
  );

  // Game-over banner state
  const [gameOverData, setGameOverData] = useState(null);  // { winner, isWin }
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  // Refs for tracking live state inside socket events
  const playingAsRef = useRef(playingAs);
  const playersListRef = useRef(playersList);
  const roomRef = useRef(room);
  const connectedPlayersRef = useRef(connectedPlayers);
  const playerNameRef = useRef(playerName);
  const prevChipsCount = useRef(0);
  const currentPlayerIndexRef = useRef(currentPlayerIndex);
  const customRoomIdRef = useRef(customRoomId);
  const touchStartX = useRef(null);

  useEffect(() => { playingAsRef.current = playingAs; }, [playingAs]);
  useEffect(() => { playersListRef.current = playersList; }, [playersList]);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { connectedPlayersRef.current = connectedPlayers; }, [connectedPlayers]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { setPlayerName(profile.name); }, [profile.name]);
  useEffect(() => { currentPlayerIndexRef.current = currentPlayerIndex; }, [currentPlayerIndex]);
  useEffect(() => { customRoomIdRef.current = customRoomId; }, [customRoomId]);

  // Turn Countdown Timer logic
  useEffect(() => {
    const isGameActive = (playOnline || inCustomGame) && playersList.length > 0 && playingAs !== null;
    if (!isGameActive) {
      setTurnTimeLeft(60);
      return;
    }

    const limit = activeStake ? activeStake.time : 60;
    setTurnTimeLeft(limit);

    const interval = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayerIndex, playOnline, inCustomGame, playersList.length, playingAs, activeStake]);

  // Lemon Squeezy Payment Redirect Success Listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      const pack = params.get("pack");
      let coinsToAdd = 0;
      let addedBoosters = { shield: 0, wildUpgrade: 0, reroll: 0 };
      let packName = "";

      if (pack === "bronze") {
        coinsToAdd = 10000;
        addedBoosters = { shield: 1, wildUpgrade: 0, reroll: 2 };
        packName = "Bronze Tactician Combo";
      } else if (pack === "silver") {
        coinsToAdd = 25000;
        addedBoosters = { shield: 3, wildUpgrade: 2, reroll: 0 };
        packName = "Silver Master Combo";
      } else if (pack === "gold") {
        coinsToAdd = 75000;
        addedBoosters = { shield: 5, wildUpgrade: 5, reroll: 5 };
        packName = "Gold Champion Combo";
      } else if (pack === "coins_7k") {
        coinsToAdd = 7000;
        packName = "7,000 Coins Pack";
      } else if (pack === "coins_10k") {
        coinsToAdd = 10000;
        packName = "10,000 Coins Pack";
      } else if (pack === "coins_25k") {
        coinsToAdd = 25000;
        packName = "25,000 Coins Pack";
      } else if (pack === "coins_100k") {
        coinsToAdd = 100000;
        packName = "100,000 Coins Pack";
      } else if (pack === "coins_250k") {
        coinsToAdd = 250000;
        packName = "250,000 Coins Pack";
      } else if (pack === "coins_500k") {
        coinsToAdd = 500000;
        packName = "500,000 Coins Pack";
      } else if (pack === "coins_1m") {
        coinsToAdd = 1000000;
        packName = "1,000,000 Coins Pack";
      } else if (pack === "coins_2m") {
        coinsToAdd = 2000000;
        packName = "2,000,000 Coins Pack";
      } else if (pack === "coins_5m") {
        coinsToAdd = 5000000;
        packName = "5,000,000 Coins Pack";
      }

      if (coinsToAdd > 0) {
        // 1. Update coins
        updateCoins(coinsToAdd);

        // 2. Update boosters in localStorage & state
        const saved = localStorage.getItem("seq_boosters");
        let current = { shield: 0, wildUpgrade: 0, reroll: 0 };
        if (saved) {
          try { current = JSON.parse(saved); } catch (e) {}
        }
        current.shield = (current.shield || 0) + addedBoosters.shield;
        current.wildUpgrade = (current.wildUpgrade || 0) + addedBoosters.wildUpgrade;
        current.reroll = (current.reroll || 0) + addedBoosters.reroll;
        
        localStorage.setItem("seq_boosters", JSON.stringify(current));
        setBoosters(current);

        // 3. Clear URL query parameters to avoid double-claim on refresh
        window.history.replaceState({}, document.title, window.location.pathname);

        // 4. Show success alert
        Swal.fire({
          title: "Payment Successful!",
          html: `
            <div style="color: #c3bee0;">
              Thank you for purchasing the <strong>${packName}</strong>!<br><br>
              <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                💰 +${coinsToAdd.toLocaleString()} Coins
                ${(addedBoosters.shield || addedBoosters.wildUpgrade || addedBoosters.reroll) ? `
                  <br>
                  ${addedBoosters.shield ? `🛡️ +${addedBoosters.shield} Chip Guards<br>` : ''}
                  ${addedBoosters.wildUpgrade ? `🃏 +${addedBoosters.wildUpgrade} Wild Upgrades<br>` : ''}
                  ${addedBoosters.reroll ? `🔄 +${addedBoosters.reroll} Card Redraws<br>` : ''}
                ` : ''}
              </div>
            </div>
          `,
          icon: "success",
          background: '#1a123a',
          color: '#fff',
          confirmButtonColor: "var(--accent-cyan)"
        });
      }
    }
  }, []);

  // Audio Context auto-resume on first user gesture
  useEffect(() => {
    const resumeAudio = () => {
      GameSounds.initAudio();
      GameSounds.startMusic();
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

  // Initialize Socket with persistent session ID for reconnection
  useEffect(() => {
    fetch(`${SERVER_URL}/health`).catch(() => {});
    if (!socket) {
      // Store a persistent session ID so the server can reconnect us if we lose connection
      let sessionId = localStorage.getItem("sequence_session_id");
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("sequence_session_id", sessionId);
      }

      const newSocket = io(SERVER_URL, {
        autoConnect: true,
        query: { sessionId },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setSocketStatus("connected");
        setIsConnected(true);
        setConnectError(null);
        // On reconnect: if we were in a room, re-join automatically
        const savedRoom = roomRef.current;
        const savedName = playerNameRef.current;
        if (savedRoom && savedName) {
          console.log(`Reconnected — re-joining room ${savedRoom} as ${savedName}`);
          newSocket.emit("rejoin_room", { roomId: savedRoom, playerName: savedName });
        }
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
      if (urlRoomId) {
        localStorage.setItem("sequence_wizard_seen", "true");
        setShowWizard(false);
      } else if (!localStorage.getItem("sequence_wizard_seen")) {
        setShowWizard(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [urlRoomId]);

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
        setSelectCard(null);
        setHoveredCard([]);
        setBoosterMode(null);
        setLastMove(gameState.lastMove || null);
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
      setSelectCard(null);
      setHoveredCard([]);
      setUsedBoosters({ shield: false, wildUpgrade: false, reroll: false });
      setBoosterMode(null);
      setBoosters(getInitialBoosters());
      setLastMove(data.lastMove || null);

      // If it is our turn on start, play turn alert
      if (data.playingAs === (data.currentPlayerIndex || 0)) {
        GameSounds.playTurnAlert();
      }
    });
    socket.on("gameOver", (data) => {
      const isHost = connectedPlayersRef.current[0] === playerNameRef.current;
      const myTeam = playersListRef.current[playingAsRef.current]?.team || "unknown";
      const isWin = data.winner === myTeam;

      // Update statistics and task progress locally
      setStats(prev => {
        const nextStats = {
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + (isWin ? 1 : 0),
          winnings: prev.winnings + (isWin ? (activeStake?.reward || 100) : 0),
          winStreak: isWin ? prev.winStreak + 1 : 0
        };
        // Auto-level profile based on games played
        setProfile(p => {
          const nextLvl = Math.floor(nextStats.gamesPlayed / 3) + 1;
          localStorage.setItem("seq_level", nextLvl.toString());
          return { ...p, level: nextLvl };
        });
        return nextStats;
      });

      // Update daily tasks progress
      setTasks(prevTasks => {
        return prevTasks.map(t => {
          if (inCustomGame) {
            if (t.id === 3 && isWin) { // Earn 10,000 coins in Friends
              return { ...t, current: Math.min(t.target, t.current + 500) };
            }
            if (t.id === 4 && isWin) { // Win 3 games in Friends
              return { ...t, current: Math.min(t.target, t.current + 1) };
            }
          } else {
            if (t.id === 1) { // Play 5 games online
              return { ...t, current: Math.min(t.target, t.current + 1) };
            }
            if (t.id === 2 && isWin) { // Win 3 games online
              return { ...t, current: Math.min(t.target, t.current + 1) };
            }
            if (t.id === 5 && isWin) { // Earn 10,000 coins online
              const wonAmount = activeStake?.reward || 100;
              return { ...t, current: Math.min(t.target, t.current + wonAmount) };
            }
          }
          return t;
        });
      });

      if (isWin) {
        GameSounds.playWin();
        // Credit the reward coins
        if (activeStake) {
          updateCoins(activeStake.reward);
        } else if (inCustomGame) {
          updateCoins(500); // 500 coins for winning custom friend match
        }
      } else {
        GameSounds.playLose();
      }

      // Show the board + winner banner for 5 seconds before the popup
      const BANNER_DURATION = 5;
      setGameOverData({ winner: data.winner, isWin, isHost });
      setCountdown(BANNER_DURATION);

      // Clear any existing timer
      if (countdownRef.current) clearInterval(countdownRef.current);

      let remaining = BANNER_DURATION;
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          setGameOverData(null);
          setCountdown(0);

          const shareText = isWin
            ? `I just won a match of Sequence Battle! Can you beat me? Play now: https://sequence-liard-theta.vercel.app`
            : `I just played a match of Sequence Battle! Try it here: https://sequence-liard-theta.vercel.app`;
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent("https://sequence-liard-theta.vercel.app")}&text=${encodeURIComponent(shareText)}`;
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

          Swal.fire({
            title: `${data.winner.toUpperCase()} Won the game!`,
            html: `
              <div style="color: #d1cde3; margin-bottom: 15px; font-size: 1.05rem;">
                ${isWin ? "Congratulations! Your team won!" : "Better luck next time!"}
              </div>
              <div style="font-weight: 600; color: var(--accent-gold); margin-bottom: 10px; font-size: 0.9rem;">
                Share your result:
              </div>
              <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
                <a href="${whatsappUrl}" target="_blank" style="background:#25d366; color:white; padding:8px 14px; border-radius:8px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; box-shadow: 0 4px 10px rgba(37,211,102,0.2);">
                  WhatsApp
                </a>
                <a href="${telegramUrl}" target="_blank" style="background:#0088cc; color:white; padding:8px 14px; border-radius:8px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; box-shadow: 0 4px 10px rgba(0,136,204,0.2);">
                  Telegram
                </a>
                <a href="${twitterUrl}" target="_blank" style="background:#111; border:1px solid #333; color:white; padding:8px 14px; border-radius:8px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                  Twitter (X)
                </a>
              </div>
              <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px; align-items: center;">
                <button id="swal-share-board-btn" class="swal2-confirm swal2-styled" style="background: linear-gradient(135deg, #00f2fe, #4facfe); border: none; color: white; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4); font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; margin: 0;">
                  📸 Share Board Screenshot
                </button>
                <button id="swal-inspect-btn" class="swal2-cancel swal2-styled" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #d1cde3; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 0.8rem; margin: 0;">
                  👀 Inspect Board
                </button>
              </div>
            `,
            icon: isWin ? "success" : "error",
            background: '#1a123a',
            color: '#fff',
            showCancelButton: true,
            confirmButtonText: isHost ? "Play Again" : "Wait for Host",
            confirmButtonColor: "var(--accent-cyan)",
            cancelButtonText: "Exit to Lobby",
            cancelButtonColor: "rgba(255,255,255,0.1)",
            allowOutsideClick: false,
            didOpen: () => {
              const shareBtn = Swal.getHtmlContainer().querySelector('#swal-share-board-btn');
              if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                  const boardContainer = document.querySelector('.board-container');
                  if (!boardContainer) return;
                  const h2c = window.html2canvas;
                  if (!h2c) {
                    Swal.fire('Error', 'html2canvas not loaded yet', 'error');
                    return;
                  }
                  h2c(boardContainer, {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: '#0c071e'
                  }).then(canvas => {
                    canvas.toBlob(blob => {
                      if (!blob) return;
                      const file = new File([blob], `sequence_board.png`, { type: 'image/png' });
                      const downloadBlob = (b, fn) => {
                        const url = URL.createObjectURL(b);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fn;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      };
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        navigator.share({
                          files: [file],
                          title: 'Sequence Battle Match Result',
                          text: shareText
                        }).catch(err => {
                          console.error('Share failed:', err);
                          downloadBlob(blob, `sequence_board.png`);
                        });
                      } else {
                        downloadBlob(blob, `sequence_board.png`);
                        Swal.fire({
                          title: 'Screenshot Saved!',
                          text: 'The screenshot has been downloaded. You can now share it with your friends!',
                          icon: 'success',
                          background: '#1a123a',
                          color: '#fff',
                          confirmButtonColor: 'var(--accent-cyan)'
                        });
                      }
                    }, 'image/png');
                  });
                });
              }

              const inspectBtn = Swal.getHtmlContainer().querySelector('#swal-inspect-btn');
              if (inspectBtn) {
                inspectBtn.addEventListener('click', () => {
                  const container = Swal.getContainer();
                  if (container) {
                    container.style.opacity = '0';
                    container.style.pointerEvents = 'none';

                    const restoreBtn = document.createElement('button');
                    restoreBtn.id = 'swal-restore-btn';
                    restoreBtn.innerHTML = '🏆 Show Game Over Menu';
                    restoreBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 10000; background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; border: none; padding: 12px 20px; border-radius: 30px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.5); font-size: 0.9rem; transition: all 0.3s;';
                    restoreBtn.addEventListener('click', () => {
                      container.style.opacity = '1';
                      container.style.pointerEvents = 'auto';
                      restoreBtn.remove();
                    });
                    document.body.appendChild(restoreBtn);
                  }
                });
              }
            }
          }).then((result) => {
            const restoreBtn = document.getElementById('swal-restore-btn');
            if (restoreBtn) restoreBtn.remove();
            
            if (result.isConfirmed) {
              if (isHost) {
                socket.emit("play_again", { roomId: roomRef.current });
              } else {
                Swal.fire({
                  title: "Please wait",
                  text: "Waiting for the host to restart the game...",
                  icon: "info",
                  background: '#1a123a',
                  color: '#fff',
                  confirmButtonColor: "var(--accent-cyan)"
                });
              }
            } else {
              socket.emit("leave_room");
              window.location.href = "/";
            }
          });
        }
      }, 1000);
    });
    socket.on("game_reset_to_lobby", () => {
      setCards([]);
      setYourHand(null);
      setPlayersList([]);
      setPlayOnline(false);
      Swal.close();
      if (customRoomIdRef.current) {
        setInCustomGame(true);
        Swal.fire({
          title: "Game Stopped",
          text: "A player left the game lobby. Returning to waiting lobby...",
          icon: "info",
          background: '#1a123a',
          color: '#fff',
          confirmButtonColor: "var(--accent-cyan)"
        });
      } else {
        setInCustomGame(false);
        Swal.fire({
          title: "Game Stopped",
          text: "A player left the game lobby. Returning to main menu...",
          icon: "info",
          background: '#1a123a',
          color: '#fff',
          confirmButtonColor: "var(--accent-cyan)"
        });
      }
    });
    socket.on("custom_room_created", (data) => {
      setInCustomGame(true);
      setCustomRoomId(data.roomId);
      Swal.fire({
        title: "Room Created",
        text: `Room created successfully. Room ID: ${data.roomId}`,
        icon: "success",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
    });
    socket.on("custom_room_joined", () => {
      setInCustomGame(true);
      Swal.fire({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 2000,
        icon: "success",
        title: "Joined room successfully.",
        background: '#1e1932',
        color: '#fff',
        iconColor: '#10d9d2'
      });
    });
    socket.on("room_join_error", (error) => {
      Swal.fire({
        title: "Error",
        text: typeof error === 'string' ? error : error.message || "Join room error",
        icon: "error",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
    });
    socket.on("room_creation_error", (error) => {
      Swal.fire({
        title: "Error",
        text: typeof error === 'string' ? error : error.message || "Failed to create room.",
        icon: "error",
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)"
      });
    });
    socket.on("room_update", (data) => {
      setConnectedPlayers(data.players);
      setPlayerLimit(data.playerLimit);
      setGameMode(data.gameMode);
      setVoiceChatEnabled(!!data.voiceChatEnabled);
    });

    // Handle successful rejoin after reconnect — server sends game state back
    socket.on("rejoin_room_success", (data) => {
      console.log("Rejoined room successfully after reconnect", data);
      setVoiceChatEnabled(!!data.voiceChatEnabled);
      if (data.gameInProgress) {
        // Game is running — restore full game state
        Swal.close();
        prevChipsCount.current = countChips(data.cards);
        setPlayOnline(true);
        setInCustomGame(true);
        setRoom(data.roomId);
        setCustomRoomId(data.roomId);
        setPlayingAs(data.playingAs);
        setYourHand(data.yourHand);
        setDeckCount(data.deckCount);
        setCards(data.cards);
        setPlayersList(data.players || []);
        setCurrentPlayerIndex(data.currentPlayerIndex || 0);
        setProtectedPatterns(data.protectedPatterns || []);
        if (data.playingAs === (data.currentPlayerIndex || 0)) {
          GameSounds.playTurnAlert();
        }
      } else {
        // Game not yet started — restore lobby state
        setPlayOnline(true);
        setInCustomGame(true);
        setRoom(data.roomId);
        setCustomRoomId(data.roomId);
        setConnectedPlayers(data.players || []);
        setPlayerLimit(data.playerLimit || 8);
        setGameMode(data.gameMode || "8_players");
      }
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
      socket.off("rejoin_room_success");
    };
  }, [socket]);

  const ensureConnected = (onConnectSuccess) => {
    if (socket && socket.connected) {
      onConnectSuccess();
      return;
    }

    // Force socket reconnection/connection if it got disconnected or lost attempts
    if (socket) {
      socket.connect();
    }

    // Wake up the server by triggering a fetch request
    fetch(`${SERVER_URL}/health`).catch(() => {});

    Swal.fire({
      title: "Connecting to Server...",
      html: `
        <div style="text-align: center; margin: 15px 0;">
          <div class="spinner-border text-info" role="status" style="width: 3rem; height: 3rem; border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #10d9d2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto;"></div>
          <p style="color: #c3bee0; font-size: 0.9rem; line-height: 1.4;">
            Waking up the game server...<br>
            Render's free tier takes about 40-50 seconds to boot when idle. Please wait.
          </p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#1a123a',
      color: '#fff',
      didOpen: () => {
        const checkInterval = setInterval(() => {
          if (socket && socket.connected) {
            clearInterval(checkInterval);
            Swal.close();
            onConnectSuccess();
          }
        }, 500);

        // Timeout after 60 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!socket || !socket.connected) {
            Swal.fire({
              title: "Connection Failed",
              text: "Could not connect to the game server. Please try again in a few seconds.",
              icon: "error",
              background: '#1a123a',
              color: '#fff',
              confirmButtonColor: "var(--accent-cyan)"
            });
          }
        }, 60000);
      }
    });
  };

  const onlineButton = useCallback(async (selectedStake = null) => {
    if (!playerName.trim()) {
      Swal.fire("Error", "Please enter your name first!", "error");
      return;
    }
    ensureConnected(() => {
      const currentStake = selectedStake || activeStake;
      socket.emit("play_online", { 
        playerName,
        stakeId: currentStake?.id,
        stakeFee: currentStake?.fee,
        stakeReward: currentStake?.reward,
        stakeName: currentStake?.name,
        boardType: currentStake?.board || "STANDARD"
      }, (response) => {
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
    });
  }, [socket, isConnected, navigate, playerName, activeStake]);

  const createCustomRoom = useCallback(async () => {
    if (!playerName.trim()) {
      Swal.fire("Error", "Please enter your name first!", "error");
      return;
    }
    ensureConnected(() => {
      socket.emit("create_custom_room", { playerName, playerLimit, gameMode, voiceChatEnabled: lobbyVoiceChat }, (response) => {
        if (response && response.roomId) {
          setInCustomGame(true);
          setCustomRoomId(response.roomId);
          setPlayOnline(true);
          setRoom(`${response.roomId}`);
          setVoiceChatEnabled(lobbyVoiceChat);
          navigate(`/room/${response.roomId}`);
        } else {
          console.error("Failed to create custom room.");
          Swal.fire("Error", "Server failed to respond with room ID. Please try again or check the backend server logs.", "error");
        }
      });
    });
  }, [socket, isConnected, navigate, playerName, playerLimit, gameMode, lobbyVoiceChat]);

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
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)",
        cancelButtonColor: "rgba(255,255,255,0.06)"
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
        background: '#1a123a',
        color: '#fff',
        confirmButtonColor: "var(--accent-cyan)",
        cancelButtonColor: "rgba(255,255,255,0.06)"
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
    ensureConnected(() => {
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
    });
  };

  const startBotGame = useCallback(() => {
    navigate("/bot");
  }, [navigate]);

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

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    const swipeThreshold = 60; // minimum pixels to trigger a tab swipe

    if (Math.abs(diffX) > swipeThreshold) {
      const tabsOrder = ["FRIENDS", "DAILY_BONUS", "HOME", "DAILY_TASK", "STORE"];
      const currentIndex = tabsOrder.indexOf(activeTab);

      if (diffX > 0 && currentIndex < tabsOrder.length - 1) {
        // Swiped Left -> Move to next tab
        setStakesOpen(false);
        setActiveTab(tabsOrder[currentIndex + 1]);
      } else if (diffX < 0 && currentIndex > 0) {
        // Swiped Right -> Move to previous tab
        setStakesOpen(false);
        setActiveTab(tabsOrder[currentIndex - 1]);
      }
    }
    touchStartX.current = null;
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ opacity: 0.7 }}>Turn:</span>
            {isMyTurn ? (
              <span className="blink-turn" style={{ color: "var(--accent-gold)", fontWeight: "800" }}>YOUR TURN! ⭐ ({turnTimeLeft}s)</span>
            ) : (
              <span style={{ 
                color: activeTeam === "blue" ? "#3b82f6" : activeTeam === "red" ? "#ef4444" : activeTeam === "green" ? "#22c55e" : "#b0a9c9", 
                fontWeight: "700" 
              }}>
                {activePlayer?.name || "Opponent"} ({turnTimeLeft}s)
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
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", color: "var(--accent-gold)", marginBottom: "12px", letterSpacing: "1px" }}>Welcome to Sequence Battle</h3>
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
      <div id="splash-screen" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#0f0b1e", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "scaleIn 1.0s ease forwards", padding: "20px" }}>
          <img src="/assests/zaesar_logo.png" alt="Zaesar Games Logo" style={{ width: "240px", maxWidth: "80vw", height: "auto", marginBottom: "1.5rem", filter: "drop-shadow(0 10px 20px rgba(16, 217, 210, 0.3))", borderRadius: "16px" }} />
          <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--accent-cyan)", letterSpacing: "4px", textTransform: "uppercase", animation: "pulse 1.5s infinite alternate", marginTop: "0.5rem" }}>
            Loading Sequence Battle...
          </div>
        </div>
      </div>
    );
  }

  // 2. Setup Screen / Lobby Choice (High-Graphics Purple Redesign)
  if (!playOnline && !inCustomGame) {
    const handleSaveProfile = (newProfile) => {
      setProfile(prev => {
        const updated = { ...prev, name: newProfile.name, avatarId: newProfile.avatarId };
        localStorage.setItem("seq_pname", updated.name);
        localStorage.setItem("seq_avatar", updated.avatarId.toString());
        return updated;
      });
    };

    const handleToggleSetting = (key, value = null) => {
      setGameSettings(prev => {
        const updated = { ...prev, [key]: value !== null ? value : !prev[key] };
        localStorage.setItem("seq_settings", JSON.stringify(updated));
        if (key === "music") {
          GameSounds.updateMusic();
        }
        GameSounds.triggerVibration(50);
        return updated;
      });
    };

    const handleSupportClick = () => {
      Swal.fire({
        title: "Customer Support",
        html: `
          <div style="text-align: center; color: #fff;">
            <p style="margin-bottom: 12px; font-size: 1rem; color: #ecc94b; font-weight: bold;">Zaesar Games Support</p>
            <p style="font-size: 0.9rem; line-height: 1.4; color: #c3bee0;">
              Have questions or found a bug? We'd love to help you! Reach us at:
            </p>
            <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 10px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 1rem; color: #10d9d2; display: flex; align-items: center; justify-content: center; gap: 8px;">
              sarwan.haider@gmail.com
            </div>
            <p style="font-size: 0.78rem; color: #a0aec0;">Response time: Usually within 24 hours.</p>
          </div>
        `,
        confirmButtonText: "Copy Email",
        showCancelButton: true,
        cancelButtonText: "Close",
        confirmButtonColor: "var(--accent-cyan)",
        cancelButtonColor: "rgba(255,255,255,0.15)",
        background: '#1a123a',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          navigator.clipboard.writeText("sarwan.haider@gmail.com");
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Email address copied!',
            showConfirmButton: false,
            timer: 1500,
            background: '#1a123a',
            color: '#fff'
          });
        }
      });
    };

    const handleTermsClick = () => {
      Swal.fire({
        title: "Terms & Conditions",
        html: `
          <div style="text-align: left; max-height: 250px; overflow-y: auto; padding-right: 8px; font-size: 0.82rem; line-height: 1.5; color: #c3bee0;">
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">1. Acceptance of Terms</p>
            <p style="margin-bottom: 15px;">By accessing and playing Sequence Battle, you agree to comply with and be bound by these Terms of Service provided by Zaesar Games.</p>
            
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">2. Virtual Currency (Coins)</p>
            <p style="margin-bottom: 15px;">Coins claimed, earned, or purchased in-game are virtual currencies with zero real-world monetary value. They are non-transferable and non-refund-able.</p>
            
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">3. Code of Conduct</p>
            <p style="margin-bottom: 15px;">Players are expected to play fairly. Exploiting bugs, running bots/hacks, or engaging in harassment is strictly prohibited and can result in account suspension.</p>
            
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">4. Limitation of Liability</p>
            <p>Zaesar Games provides the game "as-is". We are not responsible for any connectivity errors, database resets, or loss of game progress.</p>
          </div>
        `,
        confirmButtonText: "I Accept",
        confirmButtonColor: "var(--accent-cyan)",
        background: '#1a123a',
        color: '#fff'
      });
    };

    const handlePrivacyClick = () => {
      Swal.fire({
        title: "Privacy Policy",
        html: `
          <div style="text-align: left; max-height: 250px; overflow-y: auto; padding-right: 8px; font-size: 0.82rem; line-height: 1.5; color: #c3bee0;">
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">1. Information Collection</p>
            <p style="margin-bottom: 15px;">We collect minimal game-related statistics, such as your username, selected avatar ID, and coin balances, stored locally on your device or simulated cloud emulator to save your progress.</p>
            
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">2. Web Storage</p>
            <p style="margin-bottom: 15px;">We use LocalStorage to persist game settings, sound preferences, daily login streaks, and pending tasks so you don't lose progress when closing the tab.</p>
            
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">3. Third-Party Services</p>
            <p style="margin-bottom: 15px;">We do not sell, trade, or transfer any data to outside third parties. Web socket sessions are isolated and used strictly for matchmaking.</p>
            
            <p style="margin-bottom: 10px; font-weight: bold; color: #ecc94b;">4. Updates</p>
            <p>We may update this policy occasionally. Continued play constitutes acceptance of our policy modifications.</p>
          </div>
        `,
        confirmButtonText: "Close",
        confirmButtonColor: "var(--accent-cyan)",
        background: '#1a123a',
        color: '#fff'
      });
    };

    const handleRateUsClick = () => {
      let selectedRating = 5;
      Swal.fire({
        title: "Rate Sequence Battle",
        html: `
          <div style="text-align: center; color: #fff;">
            <p style="color: #c3bee0; font-size: 0.9rem; margin-bottom: 15px;">Your rating helps us improve the game!</p>
            <div id="star-rating-container" style="display: flex; justify-content: center; gap: 10px; margin: 15px 0;">
              <span class="star-btn" data-value="1" style="font-size: 2.2rem; cursor: pointer; color: #ecc94b; transition: transform 0.15s ease;">★</span>
              <span class="star-btn" data-value="2" style="font-size: 2.2rem; cursor: pointer; color: #ecc94b; transition: transform 0.15s ease;">★</span>
              <span class="star-btn" data-value="3" style="font-size: 2.2rem; cursor: pointer; color: #ecc94b; transition: transform 0.15s ease;">★</span>
              <span class="star-btn" data-value="4" style="font-size: 2.2rem; cursor: pointer; color: #ecc94b; transition: transform 0.15s ease;">★</span>
              <span class="star-btn" data-value="5" style="font-size: 2.2rem; cursor: pointer; color: #ecc94b; transition: transform 0.15s ease;">★</span>
            </div>
            <textarea id="rating-feedback" placeholder="Leave your feedback here (optional)..." style="width: 100%; height: 70px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; padding: 8px; font-size: 0.85rem; font-family: inherit; resize: none; margin-top: 10px; box-sizing: border-box;"></textarea>
          </div>
        `,
        didOpen: (modal) => {
          const stars = modal.querySelectorAll('.star-btn');
          const updateStars = (val) => {
            selectedRating = val;
            stars.forEach(star => {
              const starVal = parseInt(star.getAttribute('data-value'));
              if (starVal <= val) {
                star.style.color = '#ecc94b';
                star.style.transform = 'scale(1.15)';
              } else {
                star.style.color = 'rgba(255,255,255,0.2)';
                star.style.transform = 'scale(1.0)';
              }
            });
          };
          
          stars.forEach(star => {
            star.addEventListener('click', () => {
              const val = parseInt(star.getAttribute('data-value'));
              updateStars(val);
            });
          });
          
          updateStars(5);
        },
        confirmButtonText: "Submit Rating",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonColor: "var(--accent-cyan)",
        cancelButtonColor: "rgba(255,255,255,0.15)",
        background: '#1a123a',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Thank You!",
            text: `You rated us ${selectedRating} Stars! We appreciate your support.`,
            icon: "success",
            confirmButtonColor: "var(--accent-gold)",
            background: '#1a123a',
            color: '#fff'
          });
        }
      });
    };

    const handleCloudBackupClick = () => {
      Swal.fire({
        title: "Cloud Backup & Restore",
        text: "Securely save your game coins and streaks or restore your progress.",
        icon: "info",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Backup Progress",
        denyButtonText: "Restore Progress",
        cancelButtonText: "Cancel",
        confirmButtonColor: "var(--accent-cyan)",
        denyButtonColor: "var(--accent-gold)",
        cancelButtonColor: "rgba(255,255,255,0.15)",
        background: '#1a123a',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          const backupData = {
            profile,
            claimedDays,
            lastClaimTime
          };
          localStorage.setItem("seq_cloud_backup", JSON.stringify(backupData));
          Swal.fire({
            title: "Backup Complete",
            text: "Your profile progress has been backed up successfully!",
            icon: "success",
            confirmButtonColor: "var(--accent-cyan)",
            background: '#1a123a',
            color: '#fff'
          });
        } else if (result.isDenied) {
          const savedBackup = localStorage.getItem("seq_cloud_backup");
          if (!savedBackup) {
            Swal.fire({
              title: "No Backup Found",
              text: "You do not have any saved progress backups yet.",
              icon: "warning",
              confirmButtonColor: "var(--accent-cyan)",
              background: '#1a123a',
              color: '#fff'
            });
            return;
          }
          try {
            const data = JSON.parse(savedBackup);
            if (data.profile) {
              setProfile(data.profile);
              localStorage.setItem("seq_pname", data.profile.name);
              localStorage.setItem("seq_avatar", data.profile.avatarId.toString());
              localStorage.setItem("seq_coins", data.profile.coins.toString());
            }
            if (data.claimedDays) setClaimedDays(data.claimedDays);
            if (data.lastClaimTime) setLastClaimTime(data.lastClaimTime);
            
            Swal.fire({
              title: "Restore Successful",
              text: "Your profile progress has been restored successfully!",
              icon: "success",
              confirmButtonColor: "var(--accent-cyan)",
              background: '#1a123a',
              color: '#fff'
            });
          } catch (e) {
            Swal.fire("Error", "Failed to restore backup files.", "error");
          }
        }
      });
    };

    const handleQuitGame = () => {
      Swal.fire({
        title: "Quit Game",
        text: "Are you sure you want to exit the game?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e53e3e",
        cancelButtonColor: "rgba(255,255,255,0.15)",
        confirmButtonText: "Yes, Exit",
        background: '#1a123a',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          setSettingsOpen(false);
          window.close();
          setTimeout(() => {
            Swal.fire({
              title: "Exited Game",
              text: "You can safely close this browser tab now. Thank you for playing!",
              icon: "success",
              confirmButtonColor: "var(--accent-cyan)",
              background: '#1a123a',
              color: '#fff'
            });
          }, 200);
        }
      });
    };

    const handleClaimBonus = (amount) => {
      updateCoins(amount);
      const now = Date.now();
      setClaimedDays(prev => {
        const nextDay = Object.keys(prev).length + 1;
        const updated = { ...prev, [nextDay]: true };
        return updated;
      });
      setLastClaimTime(now);
    };

    const handleClaimTask = (taskId, reward) => {
      updateCoins(reward);
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, claimed: true } : t);
        return updated;
      });
      Swal.fire("Reward Claimed!", `You received +${reward} coins!`, "success");
    };

    const handleWatchAdProgress = (taskId) => {
      setTasks(prev => {
        return prev.map(t => {
          if (t.id === taskId) {
            const increment = t.target >= 10 ? Math.floor(t.target / 5) : 1;
            return { ...t, current: Math.min(t.target, t.current + increment) };
          }
          return t;
        });
      });
      updateCoins(100); // 100 bonus coins for watching ad
    };

    const handleSelectStakeMatch = (stake) => {
      updateCoins(-stake.fee);
      setActiveStake(stake);
      setStakesOpen(false);
      onlineButton(stake);
    };

    const totalUnclaimedTasks = tasks.filter(t => t.current >= t.target && !t.claimed).length;
    const canClaimDailyBonus = !lastClaimTime || (Date.now() - lastClaimTime) >= 24 * 60 * 60 * 1000;
    const activeBonusBadge = canClaimDailyBonus ? 1 : 0;

    return (
      <div 
        className="lobby-suit-bg w-full min-h-screen flex flex-col justify-between"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          boxShadow: "0 0 40px rgba(0,0,0,0.8)",
          borderRadius: "24px",
          border: "2px solid rgba(255, 255, 255, 0.05)",
          boxSizing: "border-box"
        }}
      >
        {renderWizard()}

        {/* Top Header */}
        <LobbyHeader 
          profile={profile}
          onAvatarClick={() => setProfileOpen(true)}
          onSettingsClick={() => setSettingsOpen(true)}
          onChatClick={() => setActiveTab("STORE")}
        />

        {/* Scrollable Center Content */}
        <div style={{ flex: 1, overflowY: "auto", width: "100%", paddingBottom: "10px" }}>
          {stakesOpen ? (
            <StakesCarousel 
              coins={profile.coins}
              onBack={() => setStakesOpen(false)}
              onSelectStake={handleSelectStakeMatch}
            />
          ) : (
            <>
              {activeTab === "HOME" && (
                <LobbyHome 
                  boosters={boosters}
                  onPlayOnline={(val) => {
                    if (typeof val === 'number') {
                      updateCoins(val);
                    } else {
                      setStakesOpen(true);
                    }
                  }}
                  onPlayFriends={() => setActiveTab("FRIENDS")}
                  onPractice={startBotGame}
                  onGoToStore={() => setActiveTab("STORE")}
                />
              )}

              {activeTab === "FRIENDS" && (
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px", animation: "fadeIn 0.35s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "4px" }}>
                    <button 
                      onClick={() => setActiveTab("HOME")}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        zIndex: 10,
                        padding: 0
                      }}
                    >
                      ←
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
                      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.5rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "2.5px" }}>PLAY WITH FRIENDS</h2>
                      <p style={{ color: "#b0a9c9", fontSize: "0.78rem", fontWeight: "600", margin: "2px 0 0 0" }}>
                        Create private rooms and play together!
                      </p>
                    </div>
                    <div style={{ width: "36px" }}></div>
                  </div>

                  <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05rem", fontWeight: "800", color: "#10d9d2", margin: "0 0 4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                      CREATE PRIVATE ROOM
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", width: "100%", marginTop: "4px" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: "800", color: "#b0a9c9", alignSelf: "flex-start" }}>SELECT GAME MODE</label>
                      
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        gap: "10px",
                        marginTop: "4px"
                      }}>
                        {/* Left Arrow */}
                        <button 
                          onClick={handlePrevFriendsMode}
                          style={{
                            background: "rgba(124, 58, 237, 0.2)",
                            border: "1px solid rgba(124, 58, 237, 0.4)",
                            color: "#10d9d2",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            fontWeight: "900",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none"
                          }}
                        >
                          ‹
                        </button>

                        {/* Card Detail */}
                        <div 
                          onTouchStart={handleFriendsTouchStart}
                          onTouchMove={handleFriendsTouchMove}
                          onTouchEnd={handleFriendsTouchEnd}
                          style={{
                            flex: 1,
                            maxWidth: "240px",
                            background: "linear-gradient(135deg, #322168 0%, #150a32 100%)",
                            border: "2.5px solid #10d9d2",
                            borderRadius: "20px",
                            padding: "20px 16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "14px",
                            boxShadow: "0 10px 30px rgba(16, 217, 210, 0.25)",
                            position: "relative",
                            userSelect: "none"
                          }}
                        >
                          {/* Room Name ribbon */}
                          <div style={{
                            background: "linear-gradient(90deg, #4c1d95, #7c3aed)",
                            border: "1px solid rgba(16, 217, 210, 0.5)",
                            borderRadius: "20px",
                            padding: "4px 18px",
                            fontSize: "0.85rem",
                            fontWeight: "800",
                            color: "white",
                            position: "absolute",
                            top: "-14px",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                            whiteSpace: "nowrap"
                          }}>
                            {activeFriendsMode.name}
                          </div>

                          {/* Players Count Capsule */}
                          <div style={{
                            background: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "14px",
                            width: "100%",
                            padding: "10px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "8px"
                          }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#b0a9c9", letterSpacing: "1px" }}>PLAYERS LIMIT</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#ecc94b" }}>
                                {activeFriendsMode.playersCount}
                              </span>
                            </div>
                          </div>

                          {/* Sub Stats Row */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                            {/* Turn time */}
                            <div style={{
                              background: "rgba(0, 0, 0, 0.2)",
                              border: "1px solid rgba(255,255,255,0.04)",
                              borderRadius: "12px",
                              padding: "6px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "2px"
                            }}>
                              <span style={{ fontSize: "0.58rem", fontWeight: "700", color: "#b0a9c9" }}>TIME PER TURN</span>
                              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#e2e8f0" }}>⏳ 60 sec</span>
                            </div>

                            {/* Sequences */}
                            <div style={{
                              background: "rgba(0, 0, 0, 0.2)",
                              border: "1px solid rgba(255,255,255,0.04)",
                              borderRadius: "12px",
                              padding: "6px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "2px"
                            }}>
                              <span style={{ fontSize: "0.58rem", fontWeight: "700", color: "#b0a9c9" }}>SEQUENCES</span>
                              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#ecc94b" }}># {activeFriendsMode.seq}</span>
                            </div>
                          </div>

                          {/* Board type */}
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            paddingBottom: "6px"
                          }}>
                            <span style={{ color: "#b0a9c9" }}>BOARD TYPE :</span>
                            <span style={{ color: "#10d9d2", fontWeight: "800" }}>{activeFriendsMode.board}</span>
                          </div>

                          {/* Team Format */}
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            fontSize: "0.75rem",
                            fontWeight: "700"
                          }}>
                            <span style={{ color: "#b0a9c9" }}>TEAM FORMAT :</span>
                            <span style={{ color: "#ecc94b", fontWeight: "800" }}>{activeFriendsMode.teamFormat}</span>
                          </div>
                        </div>

                        {/* Right Arrow */}
                        <button 
                          onClick={handleNextFriendsMode}
                          style={{
                            background: "rgba(124, 58, 237, 0.2)",
                            border: "1px solid rgba(124, 58, 237, 0.4)",
                            color: "#10d9d2",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            fontWeight: "900",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none"
                          }}
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
                      <input
                        type="checkbox"
                        id="voice-chat-checkbox"
                        checked={lobbyVoiceChat}
                        onChange={(e) => setLobbyVoiceChat(e.target.checked)}
                        style={{
                          width: "18px",
                          height: "18px",
                          accentColor: "#10d9d2",
                          cursor: "pointer"
                        }}
                      />
                      <label htmlFor="voice-chat-checkbox" style={{ fontSize: "0.85rem", fontWeight: "700", color: "#e2e8f0", cursor: "pointer" }}>
                        Enable Voice Chat (Agora)
                      </label>
                    </div>

                    <button 
                      onClick={createCustomRoom} 
                      className="btn-gold-glow"
                      style={{ padding: "12px", borderRadius: "30px", border: "none", fontSize: "0.95rem", cursor: "pointer", marginTop: "6px" }}
                    >
                      CREATE ROOM
                    </button>
                  </div>

                  <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.05rem", fontWeight: "800", color: "#ecc94b", margin: "0 0 4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                      JOIN PRIVATE ROOM
                    </h3>
                    <p style={{ color: "#c3bee0", fontSize: "0.75rem", margin: "0 0 4px 0", fontWeight: "600", lineHeight: "1.3" }}>
                      Have a Room ID from a friend? Tap below to enter and join their lobby.
                    </p>
                    <button 
                      onClick={() => joinCustomRoom()} 
                      className="btn-cyan-glow"
                      style={{ padding: "12px", borderRadius: "30px", border: "none", fontSize: "0.95rem", cursor: "pointer" }}
                    >
                      ENTER ROOM ID
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "DAILY_BONUS" && (
                <DailyBonus 
                  claimedDays={claimedDays}
                  lastClaimTime={lastClaimTime}
                  onClaim={handleClaimBonus}
                />
              )}

              {activeTab === "DAILY_TASK" && (
                <DailyTasks 
                  tasks={tasks}
                  onClaimTask={handleClaimTask}
                  onWatchAd={handleWatchAdProgress}
                />
              )}

              {activeTab === "STORE" && (
                <Store 
                  onBuyCoins={updateCoins}
                  playerCoins={profile.coins}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Nav Bar */}
        <LobbyBottomNav 
          activeTab={activeTab}
          onTabChange={(tab) => {
            setStakesOpen(false);
            setActiveTab(tab);
          }}
          badges={{ bonus: activeBonusBadge, tasks: totalUnclaimedTasks }}
        />

        {/* Overlays / Modals */}
        <SettingsModal 
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={gameSettings}
          onToggleSetting={handleToggleSetting}
          onSupport={handleSupportClick}
          onTutorial={() => {
            setSettingsOpen(false);
            setShowWizard(true);
          }}
          onTerms={handleTermsClick}
          onPrivacy={handlePrivacyClick}
          onCloudBackup={handleCloudBackupClick}
          onRateUs={handleRateUsClick}
          onQuit={handleQuitGame}
        />

        <ProfileModal 
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
          stats={stats}
        />
      </div>
    );
  }

  // 3. Waiting for Quick Match
  if (playOnline && playersList.length === 0 && !inCustomGame && isWaitingForMatch) {
    return (
      <div className="lobby-suit-bg w-full min-h-screen flex flex-col items-center justify-center text-white" style={{ maxWidth: "420px", margin: "0 auto", borderRadius: "24px" }}>
        <div className="glass-panel" style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", maxWidth: "300px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>🌐</div>
          <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.25rem", color: "#e4ca56", margin: 0, fontWeight: "900", letterSpacing: "1px" }}>MATCHMAKING</h3>
          <p style={{ color: "#c3bee0", fontSize: "0.85rem", margin: 0, lineHeight: "1.4", fontWeight: "600" }}>
            Searching for active players...
          </p>
          <div style={{ fontSize: "0.72rem", color: "#10d9d2", fontWeight: "800", animation: "blink-turn 1s infinite" }}>
            WAITING FOR OPPONENT...
          </div>
          <button 
            onClick={() => {
              if (socket) socket.emit("leave_room");
              window.location.href = "/";
            }}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#e53e3e",
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "800",
              cursor: "pointer",
              marginTop: "8px"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 4. Custom Room Lobby Waiting for Friends
  if (inCustomGame && playersList.length === 0) {
    const inviteLink = `${window.location.origin}/room/${customRoomId}`;
    const isHost = connectedPlayers[0] === playerName;

    return (
      <div className="lobby-suit-bg w-full min-h-screen flex flex-col items-center justify-center text-white p-6" style={{ maxWidth: "420px", margin: "0 auto", borderRadius: "24px" }}>
        <div className="glass-panel w-full" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", color: "#ecc94b", margin: 0, fontWeight: "900", letterSpacing: "1px" }}>
            PRIVATE LOBBY
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#c3bee0", margin: 0, fontWeight: "600", lineHeight: "1.3" }}>
            Share this ID or link to invite your friends to join:
          </p>
          
          <div style={{
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(16, 217, 210, 0.4)",
            borderRadius: "12px",
            padding: "10px",
            fontSize: "1.35rem",
            fontWeight: "900",
            color: "#10d9d2",
            letterSpacing: "1px"
          }}>
            ROOM ID: {customRoomId}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                Swal.fire({
                  toast: true,
                  position: 'top',
                  showConfirmButton: false,
                  timer: 2000,
                  icon: 'success',
                  title: 'Copied!',
                  text: 'Invite link copied to clipboard.',
                  background: '#1e1932',
                  color: '#fff',
                  iconColor: '#10d9d2'
                });
              }}
              className="btn-cyan-glow"
              style={{ flex: 1, padding: "10px 0", borderRadius: "20px", border: "none", fontSize: "0.82rem", cursor: "pointer" }}
            >
              Copy Link
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
                className="btn-gold-glow"
                style={{ flex: 1, padding: "10px 0", borderRadius: "20px", border: "none", fontSize: "0.82rem", cursor: "pointer" }}
              >
                Start Game
              </button>
            )}
          </div>

          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            padding: "16px",
            textAlign: "left"
          }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#ecc94b", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
              CONNECTED ({connectedPlayers.length} / {playerLimit})
            </h4>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {connectedPlayers.map((player, idx) => (
                <li style={{ fontSize: "0.85rem", fontWeight: "700", color: "#e2e8f0", display: "flex", justifyContent: "space-between" }} key={idx}>
                  <span>👤 {player}</span>
                  {idx === 0 && <span style={{ fontSize: "0.65rem", color: "#ecc94b", border: "1px solid #ecc94b", padding: "1px 6px", borderRadius: "8px" }}>HOST</span>}
                </li>
              ))}
            </ul>
          </div>

          {voiceChatEnabled && (
            <VoiceChatControls
              connected={voiceConnected}
              muted={voiceMuted}
              toggleMute={toggleVoiceMute}
              error={voiceError}
              isLobby={true}
            />
          )}

          <button 
            onClick={() => {
              if (socket) socket.emit("leave_room");
              window.location.href = "/";
            }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#b0a9c9",
              padding: "8px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
              marginTop: "4px"
            }}
          >
            Leave Lobby
          </button>
        </div>
      </div>
    );
  }

  // 5. Active Game Screen
  let targetGoal = 2;
  if (gameMode === "3_players" || gameMode === "6_players_3_teams") {
    targetGoal = 1;
  }

  const renderWinnerBanner = () => {
    if (!gameOverData) return null;
    const { winner, isWin } = gameOverData;
    const teamColor = winner === "blue" ? "#3b82f6" : winner === "red" ? "#ef4444" : "#22c55e";
    const teamGlow = winner === "blue" ? "rgba(59,130,246,0.5)" : winner === "red" ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.5)";
    const bgGradient = winner === "blue"
      ? "linear-gradient(135deg, rgba(30,58,138,0.97) 0%, rgba(37,99,235,0.97) 100%)"
      : winner === "red"
      ? "linear-gradient(135deg, rgba(127,29,29,0.97) 0%, rgba(220,38,38,0.97) 100%)"
      : "linear-gradient(135deg, rgba(20,83,45,0.97) 0%, rgba(22,163,74,0.97) 100%)";

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9000,
        background: bgGradient,
        backdropFilter: "blur(12px)",
        borderBottom: `3px solid ${teamColor}`,
        boxShadow: `0 4px 30px ${teamGlow}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        animation: "slideDownBanner 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
      }}>
        {/* Left: Trophy + winner text */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "2.2rem", filter: "drop-shadow(0 0 8px gold)" }}>
            {isWin ? "🏆" : "😔"}
          </span>
          <div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: "900",
              fontSize: "clamp(1rem, 3vw, 1.5rem)",
              color: "white",
              textShadow: `0 0 12px ${teamColor}`,
              letterSpacing: "2px",
              textTransform: "uppercase"
            }}>
              {winner.toUpperCase()} TEAM WINS!
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginTop: "2px", fontWeight: "500" }}>
              {isWin ? "🎉 Congratulations! Look at your winning sequences below!" : "Study the winning sequences on the board..."}
            </div>
          </div>
        </div>

        {/* Right: Countdown ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <div style={{
            width: "52px", height: "52px",
            borderRadius: "50%",
            border: `3px solid ${teamColor}`,
            boxShadow: `0 0 12px ${teamGlow}, inset 0 0 8px ${teamGlow}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.3)"
          }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: "900", fontSize: "1.4rem", color: "white" }}>
              {countdown}
            </span>
          </div>
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>
            seconds
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderWizard()}
      {renderWinnerBanner()}
      <div id="game-screen" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", flex: 1, minHeight: 0, paddingTop: gameOverData ? "80px" : "0", transition: "padding-top 0.4s ease" }}>
        {renderMobileHeader()}
        
        <div className="game-layout">
          {/* Left: Cards Grid (Wood container is inside Cards component) */}
          <Cards
            roomId={room} 
            socket={socket}
            cards={cards}
            selectCard={selectCard}
            setSelectCard={setSelectCard}
            hoveredCard={hoveredCard}
            currentPlayerIndex={currentPlayerIndex}
            playingAs={playingAs}
            protectedPatterns={protectedPatterns}
            hoveredCardId={hoveredCardId}
            myTeam={playersList[playingAs]?.team}
            boosterMode={boosterMode}
            setBoosterMode={setBoosterMode}
            setBoosters={setBoosters}
            setUsedBoosters={setUsedBoosters}
            lastMove={lastMove}
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
              <div className={`turn-alert turn-${playersList[currentPlayerIndex]?.team || "blue"}`} style={{ fontSize: "0.8rem", padding: "6px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{playingAs === currentPlayerIndex ? "Your Turn" : `${playersList[currentPlayerIndex]?.name || "Opponent"}'s Turn`}</span>
                <span style={{ fontWeight: "800", background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: "8px", color: turnTimeLeft <= 10 ? "#ef4444" : "inherit" }}>
                  ⏱️ {turnTimeLeft}s
                </span>
              </div>

              <ScoreComponent redScore={redScore} blueScore={blueScore} greenScore={greenScore} targetSequences={targetGoal} />
            </div>

            {/* Turn List Panel */}
            <PlayerTurn
              players={playersList}
              currentPlayerIndex={currentPlayerIndex}
              playingAs={playingAs}
            />

            {/* Tactic Cards Dock */}
            {playingAs !== -1 && (
              <div className="booster-dock">
                <span style={{ marginRight: '4px', fontSize: '0.75rem', fontWeight: '800', color: '#b0a9c9' }}>TACTICS:</span>
                {[
                  { key: 'shield', name: 'Chip Guard', icon: '🛡️' },
                  { key: 'wildUpgrade', name: 'Wild Upgrade', icon: '🃏' },
                  { key: 'reroll', name: 'Card Redraw', icon: '🔄' }
                ].map(booster => {
                  const count = boosters[booster.key] || 0;
                  const isUsed = usedBoosters[booster.key];
                  const isDisabled = count <= 0 || isUsed || playingAs !== currentPlayerIndex;
                  const isActive = boosterMode === booster.key;

                  return (
                    <button
                      key={booster.key}
                      className={`booster-button ${isDisabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`}
                      disabled={isDisabled}
                      onClick={() => handleActivateBooster(booster.key)}
                      title={`${booster.name} (${count} left)`}
                    >
                      <span className="booster-icon-display">{booster.icon}</span>
                      <span className="booster-label-display">{booster.name}</span>
                      {count > 0 && <span className="booster-count-badge">{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hand Container Panel */}
            <PlayerDeck
              socket={socket}
              playerHand={yourHand}
              selectCard={selectCard}
              setSelectCard={setSelectCard}
              setHoveredCard={setHoveredCard}
              currentPlayerIndex={currentPlayerIndex}
              playingAs={playingAs}
              setHoveredCardId={setHoveredCardId}
              cards={cards}
              roomId={room}
              boosterMode={boosterMode}
              setBoosterMode={setBoosterMode}
              setBoosters={setBoosters}
              setUsedBoosters={setUsedBoosters}
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
      {voiceChatEnabled && playersList.length > 0 && (
        <VoiceChatControls
          connected={voiceConnected}
          muted={voiceMuted}
          toggleMute={toggleVoiceMute}
          error={voiceError}
          isLobby={false}
        />
      )}
    </>
  );
}