import React from 'react';

const ScoreComponent = ({ redScore, blueScore, greenScore }) => {
  return (
    <div className="score-list w-full mt-2">
      {/* Blue Team */}
      <div className="score-item blue">
        <span style={{ display: "flex", alignItems: "center" }}>
          <span className="score-dot blue"></span>
          Blue Team
        </span>
        <span className="score-value">{blueScore}</span>
      </div>

      {/* Red Team */}
      <div className="score-item red">
        <span style={{ display: "flex", alignItems: "center" }}>
          <span className="score-dot red"></span>
          Red Team
        </span>
        <span className="score-value">{redScore}</span>
      </div>

      {/* Green Team */}
      {greenScore !== undefined && (
        <div className="score-item green">
          <span style={{ display: "flex", alignItems: "center" }}>
            <span className="score-dot green"></span>
            Green Team
          </span>
          <span className="score-value">{greenScore}</span>
        </div>
      )}
    </div>
  );
};

export default ScoreComponent;
