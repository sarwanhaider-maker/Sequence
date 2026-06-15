import React from 'react';

export default function PlayerTurn({ players = [], currentPlayerIndex, playingAs }) {
  return (
    <div className="player-turn-container">
      <div className="score-container transform scale-150 flex flex-col items-center justify-center min-w-[220px]">
        <div className="current-turn flex items-center mb-2 w-full justify-center border-b border-gray-600 pb-1">
          <h2 className="font-bold mr-2 text-white">Current Turn:</h2>
          <span className="font-bold text-green-400">
            {players[currentPlayerIndex]?.name || "Loading..."}
          </span>
        </div>
        <div className="player-tokens flex flex-col gap-1 w-full mt-1">
          {players.map((player, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between px-2 py-0.5 rounded w-full border ${
                idx === currentPlayerIndex 
                  ? 'border-yellow-400 bg-yellow-900/30 font-bold' 
                  : 'border-transparent opacity-80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full border border-white/40 ${
                  player.team === "red" 
                    ? "bg-red-500 shadow-red-500/50 shadow-sm" 
                    : player.team === "blue" 
                    ? "bg-blue-500 shadow-blue-500/50 shadow-sm" 
                    : "bg-green-500 shadow-green-500/50 shadow-sm"
                }`}></span>
                <span className="text-white text-xs">
                  {player.name} {idx === playingAs ? " (You)" : ""}
                </span>
              </div>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
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
    </div>
  );
}
