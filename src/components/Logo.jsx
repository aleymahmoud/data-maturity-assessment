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
        {/* Pie Chart "O" - Deep Indigo segments */}
        <g>
          {/* Segment 1 - 40% (144 degrees) */}
          <path
            d="M 42 50 L 42 22 A 28 28 0 0 1 64.5 34.5 Z"
            fill="#1E1B4B"
            opacity="0.95"
          />

          {/* Segment 2 - 30% (108 degrees) */}
          <path
            d="M 42 50 L 64.5 34.5 A 28 28 0 0 1 64.5 65.5 Z"
            fill="#2D2960"
            opacity="0.9"
          />

          {/* Segment 3 - 20% (72 degrees) */}
          <path
            d="M 42 50 L 64.5 65.5 A 28 28 0 0 1 42 78 Z"
            fill="#3D3876"
            opacity="0.85"
          />

          {/* Segment 4 - 10% (36 degrees) */}
          <path
            d="M 42 50 L 42 78 A 28 28 0 0 1 19.5 65.5 Z"
            fill="#4D478C"
            opacity="0.8"
          />
        </g>

        {/* Inner white circle cutout */}
        <circle
          cx="42"
          cy="50"
          r="18"
          fill="white"
        />

        {/* "A" letter overlapping - More angular/robotic design */}
        <g transform="translate(50, 28)">
          {/* A main shape - geometric/robotic style */}
          <path
            d="M 15 0 L 18 0 L 30 44 L 24 44 L 21 34 L 9 34 L 6 44 L 0 44 L 12 0 L 15 0 Z"
            fill="#1E1B4B"
          />
          {/* A cross bar - rectangular and bold */}
          <rect
            x="10"
            y="24"
            width="10"
            height="4"
            fill="white"
            opacity="0.95"
          />
        </g>

        {/* Thin separator lines on pie chart for definition */}
        <line x1="42" y1="50" x2="42" y2="22" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="42" y1="50" x2="64.5" y2="34.5" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="42" y1="50" x2="64.5" y2="65.5" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="42" y1="50" x2="42" y2="78" stroke="white" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  );
}
