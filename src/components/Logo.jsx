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
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* The O - Circle representing complete vision/Omni */}
        <circle
          cx="26"
          cy="34"
          r="22"
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
        />

        {/* North Star - 8-point star shape */}
        <path
          d="M 48 14 L 50 8 L 52 14 L 58 16 L 52 18 L 50 24 L 48 18 L 42 16 Z"
          fill={strokeColor}
        />

        {/* North Star rays */}
        <line x1="50" y1="4" x2="50" y2="7" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="50" y1="25" x2="50" y2="28" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="38" y1="16" x2="41" y2="16" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="59" y1="16" x2="62" y2="16" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
