// Small inline SVG icon set for the Inspera-style exam UI.
// Kept self-contained (no icon library) so exam mode has no extra runtime deps.

export const WifiIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M2 8.5c5.5-5 14.5-5 20 0" />
    <path d="M5.5 12.5c3.8-3.4 9.2-3.4 13 0" />
    <path d="M9 16.5c2-1.8 4-1.8 6 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const BellIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const HamburgerIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const BookmarkIcon = ({ filled, ...props }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
    <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
  </svg>
);

export const ChevronLeftIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const ChevronRightIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const KeyboardIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" />
  </svg>
);

export const PencilIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const ExpandIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const FlagIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 3v18" />
    <path d="M4 4h13l-2.5 4L17 12H4" />
  </svg>
);
