import React from "react";

// Helper of 10 stylized avatars as inline SVG components
export const AVATARS = [
  // 0. Default/Guest Silhouette
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#4a5568" />
      <circle cx="50" cy="40" r="18" fill="#e2e8f0" />
      <path d="M50 62 c-18 0 -28 10 -28 22 c8 8 18 10 28 10 s20 -2 28 -10 c0 -12 -10 -22 -28 -22 z" fill="#e2e8f0" />
    </svg>
  ),
  // 1. Male Green
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#2f855a" />
      <path d="M50 15 c-12 0 -20 8 -20 18 c0 5 2 9 6 12 l-4 12 c-2 2 -2 5 0 7 c4 4 10 4 14 0 c1 -1 2 -3 2 -5 l1 -9 l1 9 c0 2 1 4 2 5 c4 4 10 4 14 0 c2 -2 2 -5 0 -7 l-4 -12 c4 -3 6 -7 6 -12 c0 -10 -8 -18 -20 -18 z" fill="#fbd38d" />
      <path d="M30 30 c0 -10 10 -15 20 -15 s20 5 20 15 c0 2 -2 4 -5 3 c-5 -2 -10 -1 -15 2 c-5 -3 -10 -4 -15 -2 c-3 1 -5 -1 -5 -3 z" fill="#2d3748" />
      <path d="M50 68 c-20 0 -32 12 -32 24 c10 6 22 8 32 8 s22 -2 32 -8 c0 -12 -12 -24 -32 -24 z" fill="#48bb78" />
    </svg>
  ),
  // 2. Female Yellow
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#ecc94b" />
      <path d="M50 18 c-10 0 -18 8 -18 18 c0 5 2 9 5 12 l-3 11 c-1 2 -1 4 1 5 c3 3 8 3 11 0 l2 -8 l2 8 c3 3 8 3 11 0 c2 -1 2 -3 1 -5 l-3 -11 c3 -3 5 -7 5 -12 c0 -10 -8 -18 -18 -18 z" fill="#ed8936" />
      <path d="M30 35 c0 -8 8 -12 18 -12 c2 0 4 1 4 3 c0 3 -3 4 -6 4 c-4 0 -8 2 -10 5 c-2 3 -6 2 -6 0 z" fill="#1a202c" />
      <path d="M50 66 c-18 0 -30 11 -30 22 c9 8 21 10 30 10 s21 -2 30 -10 c0 -11 -12 -22 -30 -22 z" fill="#dd6b20" />
    </svg>
  ),
  // 3. Male Beard
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#744210" />
      <path d="M50 20 c-10 0 -16 6 -16 15 c0 5 1 9 4 11 l-2 10 c-1 2 -1 4 1 5 c2 2 6 2 8 0 l2 -7 l2 7 c2 2 6 2 8 0 c2 -1 2 -3 1 -5 l-2 -10 c3 -2 4 -6 4 -11 c0 -9 -6 -15 -16 -15 z" fill="#fbd38d" />
      <path d="M34 32 c0 -8 8 -11 16 -11 s16 3 16 11 c0 3 -4 4 -6 2 c-3 -3 -7 -3 -10 0 c-3 -3 -7 -3 -10 0 c-2 2 -6 1 -6 -2 z" fill="#4a5568" />
      <path d="M40 50 c0 6 4 10 10 10 s10 -4 10 -10 c0 -2 -2 -3 -4 -2 c-2 1 -4 1 -6 0 c-2 1 -4 1 -6 0 c-2 -1 -4 0 -4 2 z" fill="#2d3748" />
      <path d="M50 68 c-18 0 -30 10 -30 20 c9 8 21 10 30 10 s21 -2 30 -10 c0 -10 -12 -20 -30 -20 z" fill="#ed8936" />
    </svg>
  ),
  // 4. Male Orange
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#dd6b20" />
      <path d="M50 18 c-11 0 -18 7 -18 16 c0 4 2 8 5 10 l-3 12 c-2 2 -2 4 0 6 c3 3 8 3 11 0 l1 -8 l1 8 c3 3 8 3 11 0 c2 -2 2 -4 0 -6 l-3 -12 c3 -2 5 -6 5 -10 c0 -9 -7 -16 -18 -16 z" fill="#fbd38d" />
      <path d="M32 30 c0 -8 8 -12 18 -12 s18 4 18 12 c0 2 -2 3 -4 2 c-4 -2 -9 -1 -14 2 c-5 -3 -10 -4 -14 -2 c-2 1 -4 0 -4 -2 z" fill="#7b341e" />
      <path d="M50 67 c-18 0 -30 11 -30 22 c9 7 21 9 30 9 s21 -2 30 -9 c0 -11 -12 -22 -30 -22 z" fill="#e53e3e" />
    </svg>
  ),
  // 5. Female Orange/Red
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#e53e3e" />
      <path d="M50 18 c-11 0 -18 7 -18 16 c0 4 2 8 5 10 l-3 12 c-2 2 -2 4 0 6 c3 3 8 3 11 0 l1 -8 l1 8 c3 3 8 3 11 0 c2 -2 2 -4 0 -6 l-3 -12 c3 -2 5 -6 5 -10 c0 -9 -7 -16 -18 -16 z" fill="#fbd38d" />
      <path d="M30 25 c0 -5 10 -7 20 -7 s20 2 20 7 c0 4 -2 6 -6 4 c-4 -2 -9 -1 -14 2 c-5 -3 -10 -4 -14 -2 c-4 2 -6 0 -6 -4 z" fill="#ecc94b" />
      <path d="M50 66 c-18 0 -30 11 -30 22 c9 8 21 10 30 10 s21 -2 30 -10 c0 -11 -12 -22 -30 -22 z" fill="#ecc94b" />
    </svg>
  ),
  // 6. Boy Green
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#38a169" />
      <path d="M50 20 c-9 0 -15 6 -15 14 c0 4 1 7 4 9 l-2 10 c-1 2 -1 3 1 4 c2 2 5 2 7 0 l1 -7 l1 7 c2 2 5 2 7 0 c2 -1 2 -2 1 -4 l-2 -10 c3 -2 4 -5 4 -9 c0 -8 -6 -14 -15 -14 z" fill="#fbd38d" />
      <path d="M35 30 c0 -6 6 -9 15 -9 s15 3 15 9 c0 2 -2 3 -4 2 c-3 -2 -7 -2 -11 0 c-4 -2 -8 -2 -11 0 c-2 1 -4 0 -4 -2 z" fill="#2b6cb0" />
      <path d="M50 68 c-16 0 -27 10 -27 20 c8 8 19 10 27 10 s19 -2 27 -10 c0 -10 -11 -20 -27 -20 z" fill="#3182ce" />
    </svg>
  ),
  // 7. Girl Yellow
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#d69e2e" />
      <path d="M50 20 c-9 0 -15 6 -15 14 c0 4 1 7 4 9 l-2 10 c-1 2 -1 3 1 4 c2 2 5 2 7 0 l1 -7 l1 7 c2 2 5 2 7 0 c2 -1 2 -2 1 -4 l-2 -10 c3 -2 4 -5 4 -9 c0 -8 -6 -14 -15 -14 z" fill="#fbd38d" />
      <path d="M35 26 c0 -5 7 -7 15 -7 s15 2 15 7 c0 3 -2 4 -4 3 c-3 -2 -7 -1 -11 1 c-4 -2 -8 -3 -11 -1 c-2 -1 -4 0 -4 2 z" fill="#e53e3e" />
      <path d="M50 68 c-16 0 -27 10 -27 20 c8 8 19 10 27 10 s19 -2 27 -10 c0 -10 -11 -20 -27 -20 z" fill="#dd6b20" />
    </svg>
  ),
  // 8. Man Glasses
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#3182ce" />
      <path d="M50 20 c-10 0 -16 6 -16 15 c0 5 1 9 4 11 l-2 10 c-1 2 -1 4 1 5 c2 2 6 2 8 0 l2 -7 l2 7 c2 2 6 2 8 0 c2 -1 2 -3 1 -5 l-2 -10 c3 -2 4 -6 4 -11 c0 -9 -6 -15 -16 -15 z" fill="#fbd38d" />
      <path d="M34 32 c0 -8 8 -11 16 -11 s16 3 16 11 c0 3 -4 4 -6 2 c-3 -3 -7 -3 -10 0 c-3 -3 -7 -3 -10 0 c-2 2 -6 1 -6 -2 z" fill="#1a202c" />
      {/* Glasses */}
      <circle cx="42" cy="38" r="6" stroke="#000" strokeWidth="2" fill="none" />
      <circle cx="58" cy="38" r="6" stroke="#000" strokeWidth="2" fill="none" />
      <line x1="48" y1="38" x2="52" y2="38" stroke="#000" strokeWidth="2" />
      <line x1="36" y1="36" x2="34" y2="38" stroke="#000" strokeWidth="2" />
      <line x1="64" y1="36" x2="66" y2="38" stroke="#000" strokeWidth="2" />
      <path d="M50 68 c-18 0 -30 10 -30 20 c9 8 21 10 30 10 s21 -2 30 -10 c0 -10 -12 -20 -30 -20 z" fill="#319795" />
    </svg>
  ),
  // 9. Astronaut / Space Helmet
  (props) => (
    <svg viewBox="0 0 100 100" className={props.className || "w-full h-full"} style={props.style}>
      <circle cx="50" cy="50" r="50" fill="#1a202c" />
      {/* Outer Helmet */}
      <circle cx="50" cy="46" r="32" fill="#edf2f7" stroke="#cbd5e0" strokeWidth="2" />
      {/* Visor */}
      <ellipse cx="50" cy="43" rx="24" ry="17" fill="#2b6cb0" stroke="#1a365d" strokeWidth="2" />
      {/* Visor Reflection */}
      <path d="M36 34 c4 -4 10 -6 16 -4 c2 1 3 3 2 5 c-1 2 -3 3 -5 2 c-5 -2 -10 0 -13 3 c-2 2 -4 1 -4 -1 c0 -1 2 -3 4 -5 z" fill="#63b3ed" opacity="0.6" />
      {/* Details */}
      <rect x="44" y="76" width="12" height="10" rx="2" fill="#718096" />
      <circle cx="34" cy="74" r="3" fill="#e53e3e" />
      <circle cx="66" cy="74" r="3" fill="#38a169" />
      {/* Suit Collar */}
      <path d="M50 72 c-18 0 -28 6 -28 14 c5 8 16 11 28 11 s23 -3 28 -11 c0 -8 -10 -14 -28 -14 z" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1" />
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
