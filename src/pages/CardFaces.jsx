// CardFaces.jsx — 21 點真實人頭牌 SVG 元件

export function JackOfSpades({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="14" ry="15" fill="#1a1a2e" />
      <path d="M32 22 Q50 8 68 22 L65 20 Q50 10 35 20Z" fill="#16213e" />
      <rect x="36" y="16" width="28" height="4" rx="2" fill="#0f3460" />
      <path d="M30 46 L28 82 L35 97 L50 102 L65 97 L72 82 L70 46 Q50 40 30 46Z" fill="#16213e" />
      <path d="M30 46 L50 52 L70 46 L65 54 L50 58 L35 54 Z" fill="#e94560" />
      <path d="M30 46 L20 42 L28 50Z" fill="#e94560" />
      <path d="M70 46 L80 42 L72 50Z" fill="#e94560" />
      <circle cx="44" cy="28" r="2" fill="#fff" />
      <circle cx="56" cy="28" r="2" fill="#fff" />
      <ellipse cx="50" cy="34" rx="4" ry="2" fill="#e94560" />
      <path d="M36 20 Q31 26 36 30 Q40 24 36 20Z" fill="#1a1a2e" />
      <path d="M64 20 Q69 26 64 30 Q60 24 64 20Z" fill="#1a1a2e" />
      <rect x="48" y="47" width="4" height="55" rx="2" fill="#c0c0c0" />
      <rect x="46" y="44" width="8" height="6" rx="2" fill="#d4af37" />
      <circle cx="50" cy="42" r="4" fill="#e94560" />
    </svg>
  );
}

export function QueenOfHearts({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="14" ry="15" fill="#ffe0c0" />
      <path d="M30 17 L36 10 L42 16 L50 6 L58 16 L64 10 L70 17 L68 22 L32 22Z" fill="#ffd700" />
      <rect x="30" y="20" width="40" height="4" rx="1" fill="#ffd700" />
      <circle cx="36" cy="10" r="2" fill="#ff0000" />
      <circle cx="50" cy="6" r="2.5" fill="#0000ff" />
      <circle cx="64" cy="10" r="2" fill="#00ff00" />
      <path d="M28 46 L24 84 L32 100 L50 107 L68 100 L76 84 L72 46 Q50 40 28 46Z" fill="#c41e3a" />
      <path d="M28 46 L50 54 L72 46 L66 58 L50 62 L34 58 Z" fill="#ffd700" />
      <path d="M34 50 L50 58 L66 50" stroke="#ffd700" strokeWidth="2" fill="none" />
      <circle cx="44" cy="28" r="2.5" fill="#2d1810" />
      <circle cx="56" cy="28" r="2.5" fill="#2d1810" />
      <ellipse cx="50" cy="36" rx="3" ry="2" fill="#d44" />
      <ellipse cx="45" cy="26" rx="3" ry="2" fill="#ffb5a7" />
      <ellipse cx="55" cy="26" rx="3" ry="2" fill="#ffb5a7" />
      <path d="M34 18 Q28 28 35 34 Q40 26 34 18Z" fill="#8B4513" />
      <path d="M66 18 Q72 28 65 34 Q60 26 66 18Z" fill="#8B4513" />
      <path d="M36 16 Q50 12 64 16 Q52 20 36 16Z" fill="#8B4513" />
      <path d="M38 46 Q50 52 62 46" stroke="#ffd700" strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="66" r="7" fill="#ffd700" />
      <circle cx="47" cy="62" r="1.8" fill="#ff0000" />
      <circle cx="53" cy="62" r="1.8" fill="#ff0000" />
      <circle cx="50" cy="65" r="1.8" fill="#ff0000" />
      <circle cx="50" cy="69" r="1.8" fill="#ff0000" />
      <circle cx="47" cy="68" r="1.8" fill="#ff0000" />
      <circle cx="53" cy="68" r="1.8" fill="#ff0000" />
    </svg>
  );
}

export function KingOfDiamonds({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="15" ry="16" fill="#ffe0c0" />
      <path d="M28 14 L34 6 L42 14 L50 4 L58 14 L66 6 L72 14 L70 20 L30 20Z" fill="#ffd700" />
      <rect x="28" y="18" width="44" height="5" rx="2" fill="#ffd700" />
      <circle cx="34" cy="6" r="2.5" fill="#ff0000" />
      <circle cx="50" cy="4" r="3" fill="#0000ff" />
      <circle cx="66" cy="6" r="2.5" fill="#00ff00" />
      <circle cx="50" cy="16" r="2" fill="#ff0000" />
      <path d="M36 36 Q44 47 50 40 Q56 47 64 36" stroke="#8B4513" strokeWidth="2.5" fill="none" />
      <path d="M38 38 L42 46" stroke="#8B4513" strokeWidth="2" />
      <path d="M62 38 L58 46" stroke="#8B4513" strokeWidth="2" />
      <path d="M26 46 L22 87 L30 102 L50 110 L70 102 L78 87 L74 46 Q50 39 26 46Z" fill="#1a237e" />
      <path d="M26 46 L74 46 L78 87 L70 102 L50 110 L30 102 L22 87Z" fill="none" stroke="#ffd700" strokeWidth="1.5" />
      <path d="M26 46 L50 57 L74 46 L64 58 L50 62 L36 58 Z" fill="#c62828" />
      <circle cx="43" cy="28" r="2.5" fill="#2d1810" />
      <circle cx="57" cy="28" r="2.5" fill="#2d1810" />
      <ellipse cx="50" cy="34" rx="3" ry="2" fill="#c44" />
      <ellipse cx="44" cy="25" rx="3" ry="2" fill="#ffb5a7" />
      <ellipse cx="56" cy="25" rx="3" ry="2" fill="#ffb5a7" />
      <path d="M35 16 Q28 28 35 36 Q42 26 35 16Z" fill="#4a4a4a" />
      <path d="M65 16 Q72 28 65 36 Q58 26 65 16Z" fill="#4a4a4a" />
      <path d="M34 14 Q50 0 66 14 Q50 8 34 14Z" fill="#4a4a4a" />
      <rect x="48" y="50" width="4" height="55" rx="2" fill="#ffd700" />
      <circle cx="50" cy="48" r="5" fill="#ff0000" />
      <rect x="45" y="46" width="10" height="5" rx="2" fill="#ffd700" />
    </svg>
  );
}

export function KingOfSpades({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="15" ry="16" fill="#1a1a2e" />
      <path d="M28 14 L34 6 L42 14 L50 4 L58 14 L66 6 L72 14 L70 20 L30 20Z" fill="#c0c0c0" />
      <rect x="28" y="18" width="44" height="5" rx="2" fill="#c0c0c0" />
      <circle cx="34" cy="6" r="2" fill="#000" />
      <circle cx="50" cy="4" r="2.5" fill="#333" />
      <circle cx="66" cy="6" r="2" fill="#000" />
      <path d="M36 36 Q44 47 50 40 Q56 47 64 36" stroke="#333" strokeWidth="2.5" fill="none" />
      <path d="M38 38 L42 46" stroke="#333" strokeWidth="2" />
      <path d="M62 38 L58 46" stroke="#333" strokeWidth="2" />
      <path d="M26 46 L22 87 L30 102 L50 110 L70 102 L78 87 L74 46 Q50 39 26 46Z" fill="#1a1a2e" />
      <path d="M26 46 L74 46 L78 87 L70 102 L50 110 L30 102 L22 87Z" fill="none" stroke="#c0c0c0" strokeWidth="1.5" />
      <path d="M26 46 L50 57 L74 46 L64 58 L50 62 L36 58 Z" fill="#333" />
      <circle cx="43" cy="30" r="2" fill="#fff" />
      <circle cx="57" cy="30" r="2" fill="#fff" />
      <ellipse cx="50" cy="36" rx="3" ry="2" fill="#444" />
      <path d="M35 16 Q28 28 35 36 Q42 26 35 16Z" fill="#1a1a2e" />
      <path d="M65 16 Q72 28 65 36 Q58 26 65 16Z" fill="#1a1a2e" />
      <path d="M34 14 Q50 0 66 14 Q50 8 34 14Z" fill="#1a1a2e" />
      <rect x="47" y="50" width="6" height="55" rx="2" fill="#c0c0c0" />
      <circle cx="50" cy="48" r="5" fill="#333" />
      <rect x="44" y="46" width="12" height="6" rx="3" fill="#c0c0c0" />
    </svg>
  );
}

export function JackOfHearts({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="14" ry="15" fill="#ffe0c0" />
      <path d="M30 20 Q50 4 70 20 Q60 16 50 18 Q40 16 30 20Z" fill="#c41e3a" />
      <rect x="32" y="14" width="36" height="3" rx="1.5" fill="#c41e3a" />
      <path d="M68 16 Q76 8 74 18 Q72 14 68 16Z" fill="#ff0000" />
      <path d="M70 12 Q78 4 76 16 Q74 10 70 12Z" fill="#ffd700" />
      <path d="M30 46 L28 82 L35 97 L50 102 L65 97 L72 82 L70 46 Q50 40 30 46Z" fill="#0d47a1" />
      <path d="M30 46 L50 52 L70 46 L65 54 L50 58 L35 54 Z" fill="#ffd700" />
      <circle cx="44" cy="28" r="2.5" fill="#2d1810" />
      <circle cx="56" cy="28" r="2.5" fill="#2d1810" />
      <ellipse cx="50" cy="35" rx="3" ry="2" fill="#d44" />
      <ellipse cx="44" cy="26" rx="3" ry="2" fill="#ffb5a7" />
      <ellipse cx="56" cy="26" rx="3" ry="2" fill="#ffb5a7" />
      <path d="M36 18 Q28 28 37 32 Q42 22 36 18Z" fill="#8B4513" />
      <path d="M64 18 Q72 28 63 32 Q58 22 64 18Z" fill="#8B4513" />
      <rect x="47" y="50" width="6" height="50" rx="2" fill="#c0c0c0" />
      <circle cx="50" cy="48" r="4" fill="#e94560" />
    </svg>
  );
}

export function JackOfDiamonds({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="14" ry="15" fill="#ffe0c0" />
      <path d="M30 20 Q50 4 70 20 Q60 16 50 18 Q40 16 30 20Z" fill="#e65100" />
      <rect x="32" y="14" width="36" height="3" rx="1.5" fill="#e65100" />
      <path d="M68 16 Q76 8 74 18 Q72 14 68 16Z" fill="#ffd700" />
      <path d="M70 12 Q78 4 76 16 Q74 10 70 12Z" fill="#ffd700" />
      <path d="M30 46 L28 82 L35 97 L50 102 L65 97 L72 82 L70 46 Q50 40 30 46Z" fill="#b71c1c" />
      <path d="M30 46 L50 52 L70 46 L65 54 L50 58 L35 54 Z" fill="#ffd700" />
      <circle cx="44" cy="28" r="2.5" fill="#2d1810" />
      <circle cx="56" cy="28" r="2.5" fill="#2d1810" />
      <ellipse cx="50" cy="35" rx="3" ry="2" fill="#d44" />
      <path d="M36 18 Q28 28 37 32 Q42 22 36 18Z" fill="#4a4a4a" />
      <path d="M64 18 Q72 28 63 32 Q58 22 64 18Z" fill="#4a4a4a" />
      <rect x="47" y="50" width="6" height="50" rx="2" fill="#c0c0c0" />
      <circle cx="50" cy="48" r="4" fill="#e65100" />
    </svg>
  );
}

export function QueenOfDiamonds({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="14" ry="15" fill="#ffe0c0" />
      <path d="M30 17 L36 10 L42 16 L50 6 L58 16 L64 10 L70 17 L68 22 L32 22Z" fill="#ffd700" />
      <rect x="30" y="20" width="40" height="4" rx="1" fill="#ffd700" />
      <circle cx="36" cy="10" r="2" fill="#ff0000" />
      <circle cx="50" cy="6" r="2.5" fill="#0000ff" />
      <circle cx="64" cy="10" r="2" fill="#00ff00" />
      <path d="M28 46 L24 84 L32 100 L50 107 L68 100 L76 84 L72 46 Q50 40 28 46Z" fill="#4a148c" />
      <path d="M28 46 L50 54 L72 46 L66 58 L50 62 L34 58 Z" fill="#ffd700" />
      <circle cx="44" cy="28" r="2.5" fill="#2d1810" />
      <circle cx="56" cy="28" r="2.5" fill="#2d1810" />
      <ellipse cx="50" cy="36" rx="3" ry="2" fill="#d44" />
      <path d="M34 18 Q28 28 35 34 Q40 26 34 18Z" fill="#8B4513" />
      <path d="M66 18 Q72 28 65 34 Q60 26 66 18Z" fill="#8B4513" />
      <path d="M36 16 Q50 12 64 16 Q52 20 36 16Z" fill="#8B4513" />
      <circle cx="50" cy="66" r="6" fill="#ffd700" />
      <circle cx="48" cy="64" r="1.5" fill="#ff0000" />
      <circle cx="52" cy="64" r="1.5" fill="#ff0000" />
      <circle cx="50" cy="67" r="1.5" fill="#ff0000" />
    </svg>
  );
}

export function QueenOfSpades({ size = 60 }) {
  return (
    <svg width={size} height={size * 1.26} viewBox="0 0 100 126">
      <ellipse cx="50" cy="30" rx="14" ry="15" fill="#e8d5c4" />
      <path d="M30 17 L36 10 L42 16 L50 6 L58 16 L64 10 L70 17 L68 22 L32 22Z" fill="#c0c0c0" />
      <rect x="30" y="20" width="40" height="4" rx="1" fill="#c0c0c0" />
      <circle cx="36" cy="10" r="2" fill="#333" />
      <circle cx="50" cy="6" r="2.5" fill="#333" />
      <circle cx="64" cy="10" r="2" fill="#333" />
      <path d="M28 46 L24 84 L32 100 L50 107 L68 100 L76 84 L72 46 Q50 40 28 46Z" fill="#1a1a2e" />
      <path d="M28 46 L50 54 L72 46 L66 58 L50 62 L34 58 Z" fill="#c0c0c0" />
      <circle cx="44" cy="28" r="2" fill="#2d1810" />
      <circle cx="56" cy="28" r="2" fill="#2d1810" />
      <ellipse cx="50" cy="36" rx="3" ry="2" fill="#c44" />
      <path d="M34 18 Q28 28 35 34 Q40 26 34 18Z" fill="#2d1810" />
      <path d="M66 18 Q72 28 65 34 Q60 26 66 18Z" fill="#2d1810" />
      <path d="M36 16 Q50 12 64 16 Q52 20 36 16Z" fill="#2d1810" />
      <circle cx="50" cy="66" r="6" fill="#c0c0c0" />
      <circle cx="48" cy="64" r="1.5" fill="#333" />
      <circle cx="52" cy="64" r="1.5" fill="#333" />
      <circle cx="50" cy="67" r="1.5" fill="#333" />
    </svg>
  );
}

export function getFaceCardComponent(suit, value) {
  const key = `${value}_${suit}`;
  const map = {
    'J_♠': JackOfSpades,
    'J_♥': JackOfHearts,
    'J_♦': JackOfDiamonds,
    'J_♣': JackOfSpades,
    'Q_♠': QueenOfSpades,
    'Q_♥': QueenOfHearts,
    'Q_♦': QueenOfDiamonds,
    'Q_♣': QueenOfSpades,
    'K_♠': KingOfSpades,
    'K_♥': KingOfDiamonds,
    'K_♦': KingOfDiamonds,
    'K_♣': KingOfSpades,
  };
  return map[key];
}