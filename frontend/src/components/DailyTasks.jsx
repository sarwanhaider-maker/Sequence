import React from "react";
import { CoinIcon } from "./Avatars";
import Swal from "sweetalert2";

export default function DailyTasks({ tasks = [], onClaimTask, onWatchAd }) {

  const handleWatchAd = (task) => {
    Swal.fire({
      title: "Loading Ad...",
      html: "Watching video ad to get task progress boost...",
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then((result) => {
      // Simulate progress increase
      onWatchAd(task.id);
      Swal.fire("Success!", "You watched the ad and gained progress/coins!", "success");
    });
  };

  return (
    <div style={{
      width: "100%",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      animation: "fadeIn 0.35s ease-out"
    }}>
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.6rem", fontWeight: "900", color: "#e4ca56", margin: 0, letterSpacing: "2.5px" }}>DAILY TASKS</h2>
        <p style={{ color: "#b0a9c9", fontSize: "0.85rem", fontWeight: "600", margin: "4px 0 0 0" }}>
          Complete challenges to earn massive coin bonuses!
        </p>
      </div>

      {/* Task List */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        {tasks.map((task) => {
          const progressPercent = Math.min(100, Math.floor((task.current / task.target) * 100));
          const isCompleted = task.current >= task.target;
          
          return (
            <div key={task.id} style={{
              background: "linear-gradient(135deg, #2c1e57 0%, #150d38 100%)",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
            }}>
              {/* Task Text */}
              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "white", lineHeight: "1.3" }}>
                {task.text}
              </div>

              {/* Progress and Reward Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                {/* Reward display */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <CoinIcon className="w-5 h-5" />
                  <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#e4ca56" }}>
                    {task.reward >= 1000 ? `${task.reward / 1000}K` : task.reward}
                  </span>
                </div>

                {/* Progress bar container */}
                <div style={{ flex: 1, position: "relative" }}>
                  {/* Outer Bar */}
                  <div style={{
                    height: "14px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    overflow: "hidden"
                  }}>
                    {/* Inner Progress Fill */}
                    <div style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #10d9d2 0%, #0bb5ae 100%)",
                      borderRadius: "10px",
                      transition: "width 0.4s ease"
                    }} />
                  </div>
                  {/* Percent text overlays */}
                  <div style={{
                    position: "absolute",
                    top: "-1px", right: "8px",
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    color: progressPercent > 50 ? "#0c0821" : "#b0a9c9",
                    pointerEvents: "none"
                  }}>
                    {progressPercent}%
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                  {task.claimed ? (
                    <div style={{
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      color: "#10d9d2",
                      background: "rgba(16, 217, 210, 0.15)",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      textAlign: "center"
                    }}>
                      CLAIMED
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => onClaimTask(task.id, task.reward)}
                      style={{
                        background: "linear-gradient(135deg, #48bb78, #2f855a)",
                        border: "none",
                        color: "white",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontSize: "0.78rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(72,187,120,0.3)"
                      }}
                    >
                      CLAIM
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => handleWatchAd(task)}
                        style={{
                          background: "linear-gradient(135deg, #ecc94b, #d69e2e)",
                          border: "none",
                          color: "#0c0821",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: "0 4px 10px rgba(236,201,75,0.3)"
                        }}
                      >
                        WATCH AD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
