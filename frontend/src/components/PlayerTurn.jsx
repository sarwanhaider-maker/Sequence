import React from 'react';

export default function PlayerTurn({ players = [], currentPlayerIndex, playingAs }) {
  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", minHeight: "120px", flexShrink: 0 }}>
      <div className="info-title" style={{ marginBottom: "6px", fontSize: "0.85rem" }}>
        <span>ACTIVE PLAYERS</span>
      </div>
      <div className="player-tokens animate-[fadeIn_0.3s_ease-out]" style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", maxHeight: "150px" }}>
        {players.map((player, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between px-2 py-1.5 rounded w-full border transition-all ${
              idx === currentPlayerIndex 
                ? 'border-yellow-400 bg-yellow-900/20 font-bold' 
                : 'border-transparent opacity-85'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full border border-white/30 ${
                player.team === "red" 
                  ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" 
                  : player.team === "blue" 
                  ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" 
                  : "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
              }`}></span>
              <span className="text-white text-xs">
                {player.name} {idx === playingAs ? " (You)" : ""}
              </span>
            </div>
            <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
              player.team === "red"
                ? "text-red-300 bg-red-950/40"
                : player.team === "blue"
                ? "text-blue-300 bg-blue-950/40"
                : "text-green-300 bg-green-950/40"
            }`}>
              {player.team}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
