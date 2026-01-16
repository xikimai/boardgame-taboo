'use client';

interface WavyConnectorProps {
  flip?: boolean;
  className?: string;
}

export function WavyConnector({ flip = false, className = '' }: WavyConnectorProps) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={`w-28 h-10 flex-shrink-0 ${flip ? 'scale-y-[-1]' : ''} ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0,20 Q30,5 60,20 T120,20"
        stroke="url(#wavyGradientPastel)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <defs>
        {/* Pastel gradient - rose to violet to sky */}
        <linearGradient id="wavyGradientPastel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fda4af" stopOpacity="0.6" /> {/* rose-300 */}
          <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.8" /> {/* violet-300 */}
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.6" /> {/* sky-300 */}
        </linearGradient>
      </defs>
    </svg>
  );
}
