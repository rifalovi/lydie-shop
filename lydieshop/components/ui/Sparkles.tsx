export function SparklesBg() {
  // Motif décoratif de paillettes en SVG, utilisé en arrière-plan des sections hero / promo.
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="sparkles"
          x="0"
          y="0"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="15" cy="20" r="1.4" fill="#C9A84C">
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80" cy="60" r="1" fill="#E8A0B4">
            <animate
              attributeName="opacity"
              values="0.3;0.9;0.3"
              dur="2.4s"
              repeatCount="indefinite"
              begin="0.6s"
            />
          </circle>
          <circle cx="40" cy="95" r="1.6" fill="#E8D08A">
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              dur="2.8s"
              repeatCount="indefinite"
              begin="1.2s"
            />
          </circle>
          <circle cx="100" cy="105" r="1.2" fill="#F8C8D4">
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="3.4s"
              repeatCount="indefinite"
              begin="1.8s"
            />
          </circle>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sparkles)" />
    </svg>
  );
}
