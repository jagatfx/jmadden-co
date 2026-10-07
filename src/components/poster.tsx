/** Cut-paper teaser poster for Last Signal, drawn in SVG. */
export function Poster({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 560"
      role="img"
      aria-label="Last Signal teaser poster: a tiny astronaut on a tether drifts past a banded planet while radio waves ripple out"
      className={className}
    >
      <rect width="400" height="560" fill="var(--tomato)" />

      {/* Planet, banded like a gas giant. */}
      <defs>
        <clipPath id="planet">
          <circle cx="300" cy="410" r="190" />
        </clipPath>
      </defs>
      <g clipPath="url(#planet)">
        <rect x="100" y="200" width="400" height="400" fill="var(--sun)" />
        <rect x="100" y="300" width="400" height="26" fill="var(--pink)" transform="rotate(-12 300 410)" />
        <rect x="100" y="352" width="400" height="12" fill="var(--cobalt)" transform="rotate(-12 300 410)" />
        <rect x="100" y="420" width="400" height="40" fill="var(--pink)" transform="rotate(-12 300 410)" />
        <rect x="100" y="490" width="400" height="10" fill="var(--cobalt)" transform="rotate(-12 300 410)" />
      </g>

      {/* Radio waves from the dish, far away. */}
      <g fill="none" stroke="var(--paper)" strokeWidth="3">
        <circle cx="58" cy="120" r="26" className="ripple" />
        <circle cx="58" cy="120" r="26" className="ripple" style={{ animationDelay: "1s" }} />
        <circle cx="58" cy="120" r="26" className="ripple" style={{ animationDelay: "2s" }} />
      </g>
      <circle cx="58" cy="120" r="6" fill="var(--paper)" />

      {/* Tether from off-frame ship to the astronaut. */}
      <path
        d="M -10 250 C 80 210, 120 330, 196 286"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeDasharray="1 0"
      />

      {/* Astronaut. */}
      <g className="drift">
        <g transform="translate(196 262)">
          <rect x="-15" y="2" width="30" height="34" rx="9" fill="var(--paper)" />
          <rect x="-21" y="6" width="9" height="24" rx="4" fill="var(--ink)" />
          <circle cx="0" cy="-8" r="15" fill="var(--paper)" />
          <rect x="-9" y="-14" width="18" height="11" rx="5" fill="var(--cobalt)" />
          <rect x="11" y="6" width="20" height="8" rx="4" fill="var(--paper)" transform="rotate(-35 11 10)" />
          <rect x="-6" y="32" width="9" height="20" rx="4" fill="var(--paper)" transform="rotate(14 -2 34)" />
          <rect x="5" y="32" width="9" height="18" rx="4" fill="var(--paper)" transform="rotate(-10 9 34)" />
          <circle cx="0" cy="18" r="3" fill="var(--tomato)" className="blink" />
        </g>
      </g>

      <text
        x="28"
        y="64"
        fill="var(--paper)"
        className="font-mono"
        fontSize="11"
        letterSpacing="3"
      >
        A FILM YOU TALK TO
      </text>
      <text
        x="24"
        y="478"
        fill="var(--ink)"
        className="font-display"
        fontSize="78"
        fontStyle="italic"
        letterSpacing="-2"
      >
        Last
      </text>
      <text
        x="24"
        y="540"
        fill="var(--ink)"
        className="font-display"
        fontSize="78"
        letterSpacing="-2"
      >
        Signal
      </text>
      <text
        x="372"
        y="64"
        fill="var(--paper)"
        className="font-mono"
        fontSize="11"
        letterSpacing="3"
        textAnchor="end"
      >
        10.16.26
      </text>
    </svg>
  );
}
