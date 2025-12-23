export default function Logo({ size = 'md', className = '', variant = 'dark' }) {
  const sizes = {
    sm: { width: 40, fontSize: '1.5rem' },
    md: { width: 50, fontSize: '2.25rem' },
    lg: { width: 70, fontSize: '3rem' },
    xl: { width: 100, fontSize: '4.5rem' }
  };

  const { width } = sizes[size];

  // Color based on variant (dark = on light background, light = on dark background)
  const strokeColor = variant === 'light' ? '#ffffff' : '#1e1b4b';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={width}
        height={width}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* The O - Circle representing complete vision/Omni */}
        <circle
          cx="32"
          cy="44"
          r="28"
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
        />

        {/* North Star - Clean 4-pointed star (no rays/tails) */}
        <path
          d="M 58 18 L 61 8 L 64 18 L 74 21 L 64 24 L 61 34 L 58 24 L 48 21 Z"
          fill={strokeColor}
        />
      </svg>
    </div>
  );
}
