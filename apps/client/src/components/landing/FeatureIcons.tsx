import type { ReactNode } from "react";

// Minimal line-style glyphs used as feature "logos" in the landing marquee.
// Stroke uses currentColor so they inherit the accent token.
const base = (children: ReactNode) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const FeatureIcon = ({ name }: { name: string }) => {
  switch (name) {
    case "execution":
      return base(
        <>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        </>,
      );
    case "liquidity":
      return base(
        <>
          <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
          <path d="M9 14a3 3 0 0 0 3 3" />
        </>,
      );
    case "security":
      return base(
        <>
          <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>,
      );
    case "futures":
      return base(
        <>
          <path d="M4 19V5" />
          <path d="M20 19V5" />
          <path d="M4 8l5-3 3 4 3-5 5 4" />
        </>,
      );
    case "fees":
      return base(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 1.8 0 2.5 5 1.4 5 4 0 1.1-1.1 1.7-2.5 1.7A2.5 2.5 0 0 1 9.5 14" />
          <path d="M12 6v1.5M12 16.5V18" />
        </>,
      );
    case "api":
      return base(
        <>
          <path d="M8 7 4 12l4 5" />
          <path d="M16 7l4 5-4 5" />
          <path d="M13.5 5l-3 14" />
        </>,
      );
    default:
      return base(<circle cx="12" cy="12" r="8" />);
  }
};
