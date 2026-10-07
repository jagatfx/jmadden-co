type Node = {
  x: number;
  y: number;
  label: string;
  sub?: string;
  fill: string;
  ink?: string;
  hold?: boolean;
};

const N: Record<string, Node> = {
  open: { x: 70, y: 150, label: "The signal", sub: "shots 1–9", fill: "var(--paper)" },
  q1: { x: 210, y: 150, label: "Seal it, or", sub: "go outside?", fill: "var(--tomato)", ink: "var(--paper)", hold: true },
  a: { x: 340, y: 80, label: "Seal", sub: "lose the garden", fill: "var(--teal)", ink: "var(--paper)" },
  b: { x: 340, y: 220, label: "Outside", sub: "patch the hull", fill: "var(--cobalt)", ink: "var(--paper)" },
  arc: { x: 470, y: 150, label: "ARC's secret", sub: "shots 14–21", fill: "var(--paper)" },
  q2: { x: 600, y: 150, label: "Hear ARC,", sub: "or unplug it?", fill: "var(--tomato)", ink: "var(--paper)", hold: true },
  c: { x: 730, y: 80, label: "ARC helps", fill: "var(--plum)", ink: "var(--paper)" },
  d: { x: 730, y: 220, label: "Just us now", fill: "var(--plum)", ink: "var(--paper)" },
  q3: { x: 860, y: 150, label: "Talk to me", sub: "burn or send", fill: "var(--tomato)", ink: "var(--paper)", hold: true },
  h: { x: 1000, y: 60, label: "Homecoming", fill: "var(--sun)" },
  s: { x: 1000, y: 150, label: "The Signal", fill: "var(--pink)" },
  t: { x: 1000, y: 240, label: "Static", fill: "var(--ink)", ink: "var(--paper)" },
};

const EDGES: [string, string][] = [
  ["open", "q1"],
  ["q1", "a"],
  ["q1", "b"],
  ["a", "arc"],
  ["b", "arc"],
  ["arc", "q2"],
  ["q2", "c"],
  ["q2", "d"],
  ["c", "q3"],
  ["d", "q3"],
  ["q3", "h"],
  ["q3", "s"],
  ["q3", "t"],
];

/** How Last Signal branches: three spoken decisions, three endings. */
export function StoryMap() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <svg
        viewBox="0 0 1080 300"
        className="min-w-[760px]"
        role="img"
        aria-label="Story map: the signal, then a choice to seal or go outside, ARC's secret, a choice to hear ARC out or shut it down, then a final conversation leading to Homecoming, The Signal, or Static"
      >
        {EDGES.map(([from, to]) => {
          const a = N[from];
          const b = N[to];
          const mx = (a.x + b.x) / 2;
          return (
            <path
              key={`${from}-${to}`}
              d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2.5"
            />
          );
        })}
        {Object.entries(N).map(([key, n]) => (
          <g key={key} transform={`translate(${n.x} ${n.y})`}>
            {n.hold ? (
              <circle r="46" fill={n.fill} stroke="var(--ink)" strokeWidth="3" />
            ) : (
              <rect x="-56" y="-26" width="112" height="52" rx="26" fill={n.fill} stroke="var(--ink)" strokeWidth="3" />
            )}
            <text
              textAnchor="middle"
              y={n.sub ? -3 : 5}
              fill={n.ink ?? "var(--ink)"}
              className="font-display"
              fontSize="15"
              fontStyle={n.hold ? "italic" : "normal"}
            >
              {n.label}
            </text>
            {n.sub && (
              <text
                textAnchor="middle"
                y="14"
                fill={n.ink ?? "var(--ink)"}
                className="font-mono"
                fontSize="9.5"
                opacity="0.85"
              >
                {n.sub}
              </text>
            )}
          </g>
        ))}
        <g className="font-mono" fontSize="10" fill="var(--ink-soft)" letterSpacing="2">
          <text x="210" y="290" textAnchor="middle">YOU DECIDE</text>
          <text x="600" y="290" textAnchor="middle">YOU DECIDE</text>
          <text x="860" y="290" textAnchor="middle">YOU DECIDE</text>
        </g>
      </svg>
    </div>
  );
}
