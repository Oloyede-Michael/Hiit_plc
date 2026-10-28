// Lightweight vector illustrations used in place of photography.
export function BoardroomArt({ className = '' }) {
  return (
    <svg viewBox="0 0 400 150" className={className} role="img" aria-label="Ethics oversight committee in a boardroom">
      <rect width="400" height="150" fill="#1b2442" />
      <rect x="0" y="0" width="400" height="60" fill="#27325c" />
      <rect x="40" y="14" width="140" height="62" rx="3" fill="#3b4a82" opacity=".7" />
      <rect x="220" y="14" width="140" height="62" rx="3" fill="#3b4a82" opacity=".5" />
      <ellipse cx="200" cy="118" rx="170" ry="24" fill="#0f1730" />
      {[60, 105, 150, 200, 250, 295, 340].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={84 - (i % 2) * 4} r="9" fill={i % 3 ? '#d8b49a' : '#a77a5e'} />
          <path d={`M${x - 15} 112 q15 -26 30 0z`} fill={['#0e1530', '#34447f', '#e8ecf6', '#1d2a52'][i % 4]} />
        </g>
      ))}
    </svg>
  );
}

export function HQArt({ className = '' }) {
  return (
    <svg viewBox="0 0 520 220" className={className} role="img" aria-label="HiiT corporate headquarters, Victoria Island, Lagos">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe0f5" /><stop offset="1" stopColor="#eaf2fb" /></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6f93c4" /><stop offset="1" stopColor="#2e4f86" /></linearGradient>
      </defs>
      <rect width="520" height="220" fill="url(#sky)" />
      <rect x="20" y="90" width="70" height="110" fill="#9fb4d0" />
      <rect x="95" y="60" width="60" height="140" fill="#8aa3c6" />
      <rect x="170" y="20" width="190" height="180" fill="url(#glass)" />
      {Array.from({ length: 8 }).map((_, r) => (
        <line key={r} x1="170" x2="360" y1={20 + r * 22.5} y2={20 + r * 22.5} stroke="#fff" strokeOpacity=".25" />
      ))}
      {Array.from({ length: 8 }).map((_, c) => (
        <line key={c} y1="20" y2="200" x1={170 + c * 27} x2={170 + c * 27} stroke="#fff" strokeOpacity=".2" />
      ))}
      <rect x="375" y="70" width="80" height="130" fill="#8aa3c6" />
      <rect x="465" y="100" width="45" height="100" fill="#9fb4d0" />
      <rect x="0" y="180" width="520" height="40" fill="#5f8a54" />
      {[40, 130, 410, 480].map((x) => (<g key={x}><rect x={x} y="168" width="4" height="22" fill="#6b4f35" /><circle cx={x + 2} cy="160" r="16" fill="#3f7a46" /></g>))}
      <rect x="240" y="176" width="64" height="18" rx="3" fill="#fff" opacity=".9" />
      <text x="272" y="189" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1F3FB0" fontFamily="Inter, sans-serif">HiiT PLC</text>
    </svg>
  );
}
