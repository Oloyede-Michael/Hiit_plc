export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1F3FB0" />
      <path d="M9 8v16M15 8v16M9 16h6M21 8v16M25 8v16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
