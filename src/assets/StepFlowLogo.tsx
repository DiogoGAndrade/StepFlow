interface Props {
  size?: number
  className?: string
}

/**
 * StepFlow SVG logo component.
 * Rounded square background (indigo), staircase bars on the left,
 * circle with checkmark on the right.
 */
export default function StepFlowLogo({ size = 48, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="StepFlow logo"
    >
      {/* Background rounded square */}
      <rect width="48" height="48" rx="12" fill="#4f46e5" />

      {/* Staircase bars (left side) — 3 bars going up left to right */}
      {/* Bar 1 — bottom, tallest */}
      <rect x="6" y="28" width="6" height="14" rx="1.5" fill="white" opacity="0.95" />
      {/* Bar 2 — middle */}
      <rect x="14" y="22" width="6" height="20" rx="1.5" fill="white" opacity="0.95" />
      {/* Bar 3 — top, shortest (tallest visual height) */}
      <rect x="22" y="16" width="6" height="26" rx="1.5" fill="white" opacity="0.95" />

      {/* Circle with checkmark (right side) */}
      <circle cx="37" cy="24" r="7" fill="white" opacity="0.15" />
      <circle cx="37" cy="24" r="7" stroke="white" strokeWidth="1.8" opacity="0.95" />
      {/* Checkmark inside circle */}
      <path
        d="M33.5 24.2 L36.2 27 L40.5 21.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
    </svg>
  )
}
