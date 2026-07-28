export default function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <path strokeLinecap="round" d="M22 10v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10v4M9.5 10v4M13 10v4" />
    </svg>
  );
}
