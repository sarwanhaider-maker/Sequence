import React from 'react';

const ScoreComponent = ({ redScore, blueScore, greenScore, targetSequences = 2 }) => {
  return (
    <div className="score-container transform scale-150 sm:scale-100 sm:p-4 p-2 min-w-[150px]">
      <div className="mb-2 flex justify-between items-center border-b border-gray-600 pb-1 text-xs text-gray-300">
        <span className="font-bold">Goal:</span>
        <span className="font-bold text-yellow-400">{targetSequences} {targetSequences === 1 ? "Sequence" : "Sequences"}</span>
      </div>
      <div className="flex justify-around items-center gap-4">
        <div className="text-center px-1">
          <div className="text-red-500 font-bold text-sm">Red</div>
          <div className="text-lg font-bold text-white">{redScore}</div>
        </div>
        <div className="text-center px-1">
          <div className="text-blue-500 font-bold text-sm">Blue</div>
          <div className="text-lg font-bold text-white">{blueScore}</div>
        </div>
        {greenScore !== undefined && (
          <div className="text-center px-1 border-l border-gray-600 pl-4">
            <div className="text-green-500 font-bold text-sm">Green</div>
            <div className="text-lg font-bold text-white">{greenScore}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreComponent;
