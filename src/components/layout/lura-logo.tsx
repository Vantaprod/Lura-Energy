type Variant = 'color' | 'white';

type Props = {
  variant?: Variant;
  className?: string;
  height?: number;
};

export function LuraLogo({ variant = 'color', className, height = 44 }: Props) {
  const wordFill = variant === 'white' ? '#FFFFFF' : '#1E2D8A';
  const subFill = variant === 'white' ? 'rgba(255,255,255,0.7)' : '#6B7078';
  const gradientId = `lura-arc-${variant}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 130"
      height={height}
      role="img"
      aria-label="Lura Energy"
      className={className}
      style={{ display: 'block', width: 'auto' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#F58220" />
        </linearGradient>
      </defs>
      <circle
        cx="288"
        cy="60"
        r="50"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
      />
      <text
        x="10"
        y="84"
        fontFamily="var(--font-manrope), Manrope, system-ui, sans-serif"
        fontSize="86"
        fontWeight="800"
        fill={wordFill}
        letterSpacing="-3"
      >
        LURA
      </text>
      <text
        x="14"
        y="115"
        fontFamily="var(--font-manrope), Manrope, system-ui, sans-serif"
        fontSize="17"
        fontWeight="600"
        fill={subFill}
        letterSpacing="0.5"
      >
        Energy Permutations
      </text>
    </svg>
  );
}