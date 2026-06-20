import React, { useEffect, useState, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import Swal from 'sweetalert2';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

// Set log level to warning/error for cleaner console output
AgoraRTC.setLogLevel(3);

/**
 * Custom hook to manage the Agora voice channel connection lifecycle.
 */
export function useVoiceChat(roomId, playerName, enabled, socket) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const isConnectingRef = useRef(false);

  const toggleMute = useCallback(async () => {
    if (!localAudioTrackRef.current) return;
    try {
      const currentEnabled = localAudioTrackRef.current.enabled;
      await localAudioTrackRef.current.setEnabled(!currentEnabled);
      setMuted(currentEnabled); // if it was enabled, it is now disabled (muted)
    } catch (err) {
      console.error("Failed to toggle mute status:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) {
      cleanup();
      return;
    }

    if (!AGORA_APP_ID) {
      console.warn("Agora App ID is not configured (VITE_AGORA_APP_ID is missing). Voice chat is disabled.");
      setError("Not configured");
      return;
    }

    async function initVoice() {
      if (isConnectingRef.current || clientRef.current) return;
      isConnectingRef.current = true;
      setError(null);

      try {
        // Request token from the backend securely via socket
        let token = null;
        if (socket && socket.connected) {
          token = await new Promise((resolve) => {
            socket.emit("get_voice_token", { roomId }, (response) => {
              if (response && response.success) {
                resolve(response.token);
              } else {
                console.warn("Could not retrieve voice token from server, attempting tokenless join:", response?.error);
                resolve(null);
              }
            });
          });
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // Set up subscription listener for remote audio tracks
        client.on("user-published", async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === "audio") {
              user.audioTrack.play();
            }
          } catch (subErr) {
            console.error("Error subscribing to remote audio:", subErr);
          }
        });

        // Join the channel (using the generated token if available, or null for tokenless testing)
        const uid = await client.join(AGORA_APP_ID, roomId, token, null);
        console.log(`VoiceChat: Joined channel ${roomId} with UID ${uid}`);

        // Create and publish local mic track
        try {
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          localAudioTrackRef.current = audioTrack;
          await client.publish([audioTrack]);
          setConnected(true);
          setMuted(false);
        } catch (micErr) {
          console.error("Failed to get microphone permissions:", micErr);
          setError("Permission denied");
          Swal.fire({
            title: "Microphone Required",
            text: "This lobby has Voice Chat enabled. Please check browser microphone permissions to talk with your friends.",
            icon: "warning",
            background: '#1a123a',
            color: '#fff',
            confirmButtonColor: "var(--accent-cyan)"
          });
        }
      } catch (joinErr) {
        console.error("Agora join failed:", joinErr);
        setError("Connection failed");
      } finally {
        isConnectingRef.current = false;
      }
    }

    initVoice();

    return () => {
      cleanup();
    };

    async function cleanup() {
      setConnected(false);
      setMuted(false);

      const track = localAudioTrackRef.current;
      localAudioTrackRef.current = null;
      if (track) {
        try {
          track.stop();
          track.close();
        } catch (e) {
          console.error("Error stopping mic track:", e);
        }
      }

      const client = clientRef.current;
      clientRef.current = null;
      if (client) {
        try {
          await client.leave();
          console.log(`VoiceChat: Disconnected from channel ${roomId}`);
        } catch (e) {
          console.error("Error leaving Agora client:", e);
        }
      }
    }
  }, [roomId, enabled, socket]);

  return { connected, muted, toggleMute, error };
}

/**
 * Component displaying voice status indicator & controls.
 */
export function VoiceChatControls({ connected, muted, toggleMute, error, isLobby }) {
  const hasAppId = !!AGORA_APP_ID;

  if (!hasAppId) {
    if (isLobby) {
      return (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px dashed rgba(239, 68, 68, 0.3)",
          borderRadius: "12px",
          padding: "10px",
          fontSize: "0.75rem",
          color: "#f87171",
          textAlign: "center",
          fontWeight: "600"
        }}>
          ⚠️ Voice Chat is enabled, but the server is missing configuration (VITE_AGORA_APP_ID).
        </div>
      );
    }
    return null;
  }

  if (isLobby) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        padding: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <span style={{ fontSize: "0.72rem", color: "#b0a9c9", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Lobby Voice Chat
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: error ? "#fc8181" : connected ? (muted ? "#ecc94b" : "#10d9d2") : "#a0aec0" }}>
            {error === "Permission denied" ? "❌ Mic Permission Denied" :
             error ? "❌ Connection Failed" :
             connected ? (muted ? "🔇 Muted" : "🔊 Connected & Live") :
             "🔄 Connecting to Voice..."}
          </span>
        </div>
        {connected && (
          <button
            onClick={toggleMute}
            className="btn-cyan-glow"
            style={{
              padding: "6px 12px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "800",
              cursor: "pointer",
              background: muted ? "rgba(236, 201, 75, 0.2)" : "rgba(16, 217, 210, 0.2)",
              color: muted ? "#ecc94b" : "#10d9d2",
              border: muted ? "1px solid rgba(236, 201, 75, 0.4)" : "1px solid rgba(16, 217, 210, 0.4)"
            }}
          >
            {muted ? "🎤 Unmute" : "🔇 Mute"}
          </button>
        )}
      </div>
    );
  }

  // Active game floating widget (Bottom Left corner)
  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "20px", // Put on bottom left so it doesn't overlap chat/cards on the right
      zIndex: 9999,
      pointerEvents: "auto",
      animation: "slideUp 0.3s ease-out"
    }}>
      <button
        onClick={toggleMute}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: error ? "2px solid #ef4444" : muted ? "2px solid #ecc94b" : "2px solid #10d9d2",
          background: "rgba(12, 7, 30, 0.85)",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          boxShadow: error ? "0 0 15px rgba(239,68,68,0.4)" : muted ? "0 0 15px rgba(236,201,75,0.4)" : "0 0 15px rgba(16,217,210,0.4)",
          transition: "all 0.2s ease"
        }}
        title={error ? `Voice Error: ${error}` : muted ? "Unmute Mic" : "Mute Mic"}
      >
        <span style={{ fontSize: "1.4rem" }}>
          {error ? "❌" : muted ? "🔇" : "🎤"}
        </span>
      </button>
    </div>
  );
}
