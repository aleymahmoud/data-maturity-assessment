export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { width: 40, fontSize: '1.5rem' },
    md: { width: 60, fontSize: '2.25rem' },
    lg: { width: 80, fontSize: '3rem' },
    xl: { width: 120, fontSize: '4.5rem' }
  };

  const { width, fontSize } = sizes[size];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={width}
        height={width}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Background Circle for "O" */}
        <circle
          cx="42"
          cy="50"
          r="28"
          fill="#1E1B4B"
          opacity="0.95"
        />

        {/* Inner circle cutout for "O" */}
        <circle
          cx="42"
          cy="50"
          r="18"
          fill="white"
        />

        {/* "A" letter overlapping */}
        <g transform="translate(48, 28)">
          {/* A main triangle */}
          <path
            d="M 15 0 L 30 44 L 24 44 L 20 32 L 10 32 L 6 44 L 0 44 Z"
            fill="#8B5CF6"
          />
          {/* A cross bar */}
          <rect
            x="11"
            y="25"
            width="8"
            height="3"
            fill="white"
            opacity="0.9"
          />
        </g>

        {/* Subtle gradient overlay */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4C1D95', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.3 }} />
          </linearGradient>
        </defs>
        <circle
          cx="42"
          cy="50"
          r="28"
          fill="url(#logoGradient)"
        />
      </svg>
    </div>
  );
}
