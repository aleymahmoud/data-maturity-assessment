export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { width: 50, fontSize: '1.5rem' },
    md: { width: 70, fontSize: '2.25rem' },
    lg: { width: 90, fontSize: '3rem' },
    xl: { width: 130, fontSize: '4.5rem' }
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
        {/* Pie Chart "O" - Dark Blue, Dark Red, Dark Green segments */}
        <g>
          {/* Segment 1 - Dark Blue (120 degrees) */}
          <path
            d="M 50 50 L 50 22 A 28 28 0 0 1 78 50 Z"
            fill="#1E3A8A"
            opacity="0.95"
          />

          {/* Segment 2 - Dark Red (120 degrees) */}
          <path
            d="M 50 50 L 78 50 A 28 28 0 0 1 36 71.2 Z"
            fill="#991B1B"
            opacity="0.95"
          />

          {/* Segment 3 - Dark Green (120 degrees) */}
          <path
            d="M 50 50 L 36 71.2 A 28 28 0 0 1 50 22 Z"
            fill="#14532D"
            opacity="0.95"
          />
        </g>

        {/* Inner white circle cutout */}
        <circle
          cx="50"
          cy="50"
          r="18"
          fill="white"
        />

        {/* Thin separator lines on pie chart for definition */}
        <line x1="50" y1="50" x2="50" y2="22" stroke="white" strokeWidth="0.8" opacity="0.4" />
        <line x1="50" y1="50" x2="78" y2="50" stroke="white" strokeWidth="0.8" opacity="0.4" />
        <line x1="50" y1="50" x2="36" y2="71.2" stroke="white" strokeWidth="0.8" opacity="0.4" />
      </svg>
    </div>
  );
}
