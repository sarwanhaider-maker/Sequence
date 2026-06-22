import React from "react";

// Helper of 10 stylized recognizable premium avatars as inline SVG components
export const AVATARS = [
  // 0. Neon Gamer
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <radialGradient id="grad0" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0b2a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad0)" />
      <path d="M50 25c-8.8 0-16 7.2-16 16v6c0 .8.2 1.5.5 2.2C30 50.8 28 54.7 28 59c0 10.5 8.5 19 19 19h6c10.5 0 19-8.5 19-19c0-4.3-2-8.2-5.5-10.8c.3-.7.5-1.4.5-2.2v-6c0-8.8-7.2-16-16-16z" fill="#06b6d4" opacity="0.15" />
      <circle cx="50" cy="40" r="14" fill="#06b6d4" />
      <path d="M50 58c-15 0-25 8-25 18v4h50v-4c0-10-10-18-25-18z" fill="#06b6d4" />
      <path d="M32 40a18 18 0 0 1 36 0v10" fill="none" stroke="#10d9d2" strokeWidth="4" strokeLinecap="round" />
      <rect x="28" y="44" width="8" height="12" rx="4" fill="#e4ca56" />
      <rect x="64" y="44" width="8" height="12" rx="4" fill="#e4ca56" />
      <path d="M32 54c4 4 10 4 14 0" fill="none" stroke="#10d9d2" strokeWidth="2.5" />
    </svg>
  ),
  // 1. Cyber Knight
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad1)" />
      <path d="M50 15c0 0 15-12 25-2s-10 20-25 15" fill="#ef4444" />
      <path d="M50 22c-15 0-24 10-24 24v20h48V46c0-14-9-24-24-24z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M30 46h40v6H30z" fill="#e4ca56" filter="drop-shadow(0 0 4px #e4ca56)" />
      <path d="M47 44h6v18h-6z" fill="#e4ca56" filter="drop-shadow(0 0 4px #e4ca56)" />
      <path d="M20 82c5-8 15-12 30-12s25 4 30 12" fill="#64748b" stroke="#cbd5e1" strokeWidth="2" />
    </svg>
  ),
  // 2. Mystic Wizard
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1035" />
          <stop offset="100%" stopColor="#0a0518" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad2)" />
      <path d="M50 8L28 44h44L50 8z" fill="#312e81" stroke="#4f46e5" strokeWidth="2" />
      <ellipse cx="50" cy="44" rx="28" ry="6" fill="#4338ca" />
      <path d="M50 20l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#e4ca56" />
      <path d="M36 50c0 18 14 30 14 30s14-12 14-30H36z" fill="#f1f5f9" />
      <path d="M38 44c0 6 5 10 12 10s12-4 12-10H38z" fill="#ffedd5" />
      <circle cx="44" cy="48" r="2" fill="#10d9d2" filter="drop-shadow(0 0 2px #10d9d2)" />
      <circle cx="56" cy="48" r="2" fill="#10d9d2" filter="drop-shadow(0 0 2px #10d9d2)" />
    </svg>
  ),
  // 3. Stealth Ninja
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad3)" />
      <path d="M26 35c0-10 10-15 24-15s24 5 24 15v26c0 10-10 16-24 16S26 71 26 61V35z" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      <path d="M34 40h32v10H34z" fill="#ffedd5" />
      <path d="M38 45l6-2v4z" fill="#ef4444" filter="drop-shadow(0 0 3px #ef4444)" />
      <path d="M62 45l-6-2v4z" fill="#ef4444" filter="drop-shadow(0 0 3px #ef4444)" />
      <path d="M72 32c5-3 12 2 10 8s-8 12-10 6" fill="#ef4444" />
    </svg>
  ),
  // 4. Retro Robot
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad4)" />
      <line x1="50" y1="26" x2="50" y2="14" stroke="#94a3b8" strokeWidth="4" />
      <circle cx="50" cy="12" r="4" fill="#e4ca56" filter="drop-shadow(0 0 4px #e4ca56)" />
      <rect x="28" y="24" width="44" height="36" rx="8" fill="#475569" stroke="#64748b" strokeWidth="3" />
      <rect x="34" y="30" width="32" height="24" rx="4" fill="#0f172a" />
      <circle cx="44" cy="38" r="3" fill="#10d9d2" filter="drop-shadow(0 0 3px #10d9d2)" />
      <circle cx="56" cy="38" r="3" fill="#10d9d2" filter="drop-shadow(0 0 3px #10d9d2)" />
      <path d="M42 46q8 4 16 0" fill="none" stroke="#10d9d2" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 84c4-12 14-20 28-20s24 8 28 20" fill="#334155" stroke="#475569" strokeWidth="2" />
    </svg>
  ),
  // 5. Golden King
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#120024" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad5)" />
      <circle cx="50" cy="48" r="16" fill="#4c1d95" />
      <path d="M50 66c-16 0-26 8-26 18v4h52v-4c0-10-10-18-26-18z" fill="#4c1d95" />
      <path d="M32 38l6-16 12 10 12-10 6 16z" fill="#ecc94b" stroke="#e2e8f0" strokeWidth="1" filter="drop-shadow(0 0 6px #ecc94b)" />
      <circle cx="32" cy="38" r="2.5" fill="#ef4444" />
      <circle cx="38" cy="22" r="2.5" fill="#ef4444" />
      <circle cx="50" cy="32" r="2.5" fill="#3b82f6" />
      <circle cx="62" cy="22" r="2.5" fill="#ef4444" />
      <circle cx="68" cy="38" r="2.5" fill="#ef4444" />
    </svg>
  ),
  // 6. Cyber Hacker
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad6)" />
      <path d="M28 42c0-18 12-24 22-24s22 6 22 24c4-8 10-4 10 4c0 12-8 16-16 16" fill="#10d9d2" />
      <path d="M34 40c0 10 7 18 16 18s16-8 16-18H34z" fill="#ffedd5" />
      <path d="M30 38h40l-4 8H34z" fill="#22c55e" filter="drop-shadow(0 0 4px #22c55e)" />
      <path d="M50 68c-18 0-28 10-28 20c8 8 18 10 28 10s20-2 28-10c0-10-10-20-28-20z" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
    </svg>
  ),
  // 7. Volcanic Phoenix
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad7)" />
      <path d="M15 65c10-25 25-35 35-35s25 10 35 35" fill="#ef4444" />
      <path d="M22 55c8-18 18-25 28-25s20 7 28 25" fill="#f97316" />
      <path d="M50 25c-8 0-14 6-14 14c0 5 3 9 7 11v18h14V50c4-2 7-6 7-11c0-8-6-14-14-14z" fill="#ecc94b" />
      <path d="M50 50l-8-2 8 16 8-16z" fill="#f59e0b" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
      <circle cx="45" cy="38" r="2" fill="#ef4444" filter="drop-shadow(0 0 2px #ef4444)" />
      <circle cx="55" cy="38" r="2" fill="#ef4444" filter="drop-shadow(0 0 2px #ef4444)" />
    </svg>
  ),
  // 8. Cosmic Astronaut
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad8" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#311042" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad8)" />
      <circle cx="50" cy="46" r="26" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" />
      <ellipse cx="50" cy="44" rx="20" ry="14" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" filter="drop-shadow(0 0 5px #f59e0b)" />
      <path d="M38 36c4-4 10-6 16-4c2 1 3 3 2 5-1 2-3 3-5 2-5-2-10 0-13 3-2 2-4 1-4-1 0-1 2-3 4-5z" fill="#fff" opacity="0.4" />
      <path d="M50 72c-15 0-24 6-24 12c5 6 14 8 24 8s19-2 24-8c0-6-9-12-24-12z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
    </svg>
  ),
  // 9. Jungle Tiger
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <defs>
        <linearGradient id="grad9" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad9)" />
      <path d="M28 32c0-12 12-16 22-16s22 4 22 16c0 15-8 28-22 28S28 47 28 32z" fill="#f97316" />
      <path d="M24 40c0 5 4 8 8 5M76 40c0 5-4 8-8 5" fill="#f97316" />
      <path d="M28 30h10M72 30H62M50 16v8M45 20h10" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40 46c0 6 5 10 10 10s10-4 10-10H40z" fill="#fff" />
      <path d="M48 44l4-3 2 3-3 2z" fill="#f43f5e" />
      <polygon points="36,36 44,34 42,40 36,38" fill="#22c55e" filter="drop-shadow(0 0 3px #22c55e)" />
      <polygon points="64,36 56,34 58,40 64,38" fill="#22c55e" filter="drop-shadow(0 0 3px #22c55e)" />
    </svg>
  ),
];

// Glowing Gold Coin Icon
export const CoinIcon = (props) => (
  <svg viewBox="0 0 24 24" className={props.className || "w-6 h-6"} style={props.style}>
    <circle cx="12" cy="12" r="10" fill="url(#coinGrad)" stroke="#f6ad55" strokeWidth="1" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="#dd6b20" strokeWidth="1.5" strokeDasharray="2 1" />
    <text x="12" y="16.5" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="13" fill="#7b341e" textAnchor="middle">C</text>
    <defs>
      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ecc94b" />
        <stop offset="50%" stopColor="#f6e05e" />
        <stop offset="100%" stopColor="#d69e2e" />
      </linearGradient>
    </defs>
  </svg>
);

// Settings Gear Icon
export const SettingsIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Chat Icon
export const ChatIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || "w-6 h-6"}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="8" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
    <circle cx="16" cy="10" r="1" fill="currentColor" />
  </svg>
);
