import type { ReactNode, SVGProps } from "react";

/* مجموعة أيقونات SVG مرسومة يدوياً — stroke-based */

const P: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" />
    </>
  ),
  moon: <path d="M20 13.5A8.5 8.5 0 0 1 10.5 4 7.5 7.5 0 1 0 20 13.5z" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4.5 17.5l4.5-5 3.5 3.5 2.5-2.5 4.5 4.5" />
    </>
  ),
  resize: (
    <>
      <rect x="3.5" y="3.5" width="11" height="11" rx="2" />
      <path d="M14.5 9.5h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-4" />
      <path d="M9 9l5.5 5.5M14.5 11v3.5H11" />
    </>
  ),
  convert: (
    <>
      <path d="M4 8h12l-3-3M20 16H8l3 3" />
      <circle cx="4" cy="8" r="0.6" fill="currentColor" />
      <circle cx="20" cy="16" r="0.6" fill="currentColor" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4" />
    </>
  ),
  pdf: (
    <>
      <path d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1-1.5z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M8 13h8M8 16.5h5" />
    </>
  ),
  merge: (
    <>
      <path d="M8 3.5H5.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H8" />
      <path d="M16 3.5h2.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H16" />
      <path d="M12 6.5v11M9.5 10l2.5-2.5L14.5 10" />
    </>
  ),
  img2pdf: (
    <>
      <rect x="3" y="4" width="12" height="10" rx="2" />
      <circle cx="7" cy="8" r="1.2" />
      <path d="M4 12.5l3-3 2.5 2.5 1.5-1.5 2 2" />
      <path d="M15 20.5h3.5a2 2 0 0 0 2-2V11l-4-4H15" />
      <path d="M18 13.5h-3M12.5 17.5h6" />
    </>
  ),
  extract: (
    <>
      <path d="M5 8V5.5A1.5 1.5 0 0 1 6.5 4H12l4 4v3.5" />
      <path d="M16 8h-3.5a.5.5 0 0 1-.5-.5V4" />
      <rect x="4" y="12" width="9" height="8" rx="1.5" />
      <circle cx="7" cy="14.8" r="1" />
      <path d="M5 19l2.5-2.5 2 2 1.5-1.5 2 2" />
      <path d="M17 14v6M14.8 17.8L17 20l2.2-2.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11M8 11l4 4 4-4" />
      <path d="M4.5 16.5v2.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4.5M8 8l4-4 4 4" />
      <path d="M4.5 16.5v2.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M5.5 15.5h-1a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 4.5 3.5h9A1.5 1.5 0 0 1 15 5v.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M6 9.5l6 6 6-6" />,
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3 8-7.5 9.5-4.5-1.5-7.5-4.9-7.5-9.5V6z" />
      <path d="M8.8 12l2.3 2.3 4.2-4.6" />
    </>
  ),
  bolt: <path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.7 2.4 4 5.2 4 8.5s-1.3 6.1-4 8.5c-2.7-2.4-4-5.2-4-8.5s1.3-6.1 4-8.5z" />
    </>
  ),
  device: (
    <>
      <rect x="3" y="5" width="13" height="10" rx="1.5" />
      <path d="M7 19h5M9.5 15v4" />
      <rect x="17.5" y="8" width="4" height="11" rx="1.2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  arrow: <path d="M19 12H5M11 6l-6 6 6 6" />,
  sparkle: (
    <>
      <path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z" />
      <path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  zip: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M12 4v3M12 9.5v1M12 13v1" />
      <rect x="10" y="15.5" width="4" height="3" rx="0.8" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M6.5 6.5l.8 12.5a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </>
  ),
  up: <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />,
  down: <path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  send: <path d="M20.5 3.5L10 14M20.5 3.5L14 20.5l-4-6.5-7-3z" />,
  file: (
    <>
      <path d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1-1.5z" />
      <path d="M14 3.5V8h4.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M3.5 12.5L12 17l8.5-4.5" />
      <path d="M3.5 16.5L12 21l8.5-4.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 13-5.2L20 9.5" />
      <path d="M20 4.5v5h-5" />
      <path d="M19.5 12a7.5 7.5 0 0 1-13 5.2L4 14.5" />
      <path d="M4 19.5v-5h5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5l9.5 16.5H2.5z" />
      <path d="M12 9.5v4.5M12 17.2v.3" />
    </>
  ),
  heart: <path d="M12 20.5s-8.5-5-8.5-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.9c0 6-8.5 11-8.5 11z" />,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.8v.4" />
    </>
  ),
  wand: (
    <>
      <path d="M5 19L15.5 8.5M14 5.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
      <path d="M19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6z" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" />
      <path d="M15.5 10.75l5.5-3.25v9l-5.5-3.25" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M7 4.5v15M17 4.5v15M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  ai: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M6.5 6.5L4.5 4.5M17.5 6.5l2-2M6.5 17.5l-2 2M17.5 17.5l2 2" />
      <path d="M12 9.6l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8z" />
    </>
  ),
  expand: (
    <>
      <path d="M9 3.5H5A1.5 1.5 0 0 0 3.5 5v4M15 3.5h4A1.5 1.5 0 0 1 20.5 5v4M9 20.5H5A1.5 1.5 0 0 1 3.5 19v-4M15 20.5h4a1.5 1.5 0 0 0 1.5-1.5v-4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  eraser: (
    <>
      <path d="M8 20h12.5" />
      <path d="M6.2 16.2l8-8.2a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8l-8 8.2a2 2 0 0 1-2.8 0l-3-3a2 2 0 0 1 0-2.8z" />
      <path d="M9.8 12.5l5.7 5.7" />
    </>
  ),
  brush: (
    <>
      <path d="M14.5 4.5l5 5L9.5 19.5l-5.5.5.5-5.5z" />
      <path d="M12.5 6.5l5 5" />
      <path d="M4.5 14.5c-1.5 1.5-1.5 4-1 5.5 1.5.5 4 .5 5.5-1" />
    </>
  ),
  type: <path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6" />,
  crop: (
    <>
      <path d="M7 2.5V15a2 2 0 0 0 2 2h12.5" />
      <path d="M2.5 7H15a2 2 0 0 1 2 2v12.5" />
    </>
  ),
  undo: (
    <>
      <path d="M8 4.5L3.5 9 8 13.5" />
      <path d="M3.5 9H15a5.5 5.5 0 0 1 0 11H9.5" />
    </>
  ),
  redo: (
    <>
      <path d="M16 4.5L20.5 9 16 13.5" />
      <path d="M20.5 9H9a5.5 5.5 0 0 0 0 11h5.5" />
    </>
  ),
  rotateL: (
    <>
      <path d="M4.5 9.5a8 8 0 1 1-1 4.5" />
      <path d="M4.5 4.5v5h5" />
    </>
  ),
  rotateR: (
    <>
      <path d="M19.5 9.5a8 8 0 1 0 1 4.5" />
      <path d="M19.5 4.5v5h-5" />
    </>
  ),
  flipH: (
    <>
      <path d="M12 3.5v17" strokeDasharray="2.5 2.5" />
      <path d="M8.5 8L3.5 12l5 4V8zM15.5 8l5 4-5 4V8z" />
    </>
  ),
  flipV: (
    <>
      <path d="M3.5 12h17" strokeDasharray="2.5 2.5" />
      <path d="M8 8.5L12 3.5l4 5h-8zM8 15.5l4 5 4-5H8z" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 .3 17c1.6 0 2.2-1.1 1.6-2.2-.5-1-.2-2.3 1.3-2.3h1.6a3.7 3.7 0 0 0 3.7-3.7c0-4.9-3.9-8.8-8.5-8.8z" />
      <circle cx="8.2" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="14.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.8 1.8M9.5 2.5h5" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12.5" rx="2" />
      <path d="M9 21h6M12 17v4" />
    </>
  ),
  record: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9.5 21h5" />
    </>
  ),
  timeline: (
    <>
      <rect x="3.5" y="4.5" width="9" height="3.4" rx="1.4" />
      <rect x="15" y="4.5" width="5.5" height="3.4" rx="1.4" />
      <rect x="3.5" y="10.3" width="4.5" height="3.4" rx="1.4" />
      <rect x="10.5" y="10.3" width="10" height="3.4" rx="1.4" />
      <rect x="3.5" y="16.1" width="12" height="3.4" rx="1.4" />
    </>
  ),
  play: <path d="M8.5 5.5v13l10.5-6.5z" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  cloud: (
    <path d="M6.8 18.5h10.7a3.5 3.5 0 0 0 .5-6.97 5.5 5.5 0 0 0-10.7-1.9A4.5 4.5 0 0 0 6.8 18.5z" />
  ),
  scissors: (
    <>
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="6" cy="17.5" r="2.5" />
      <path d="M8.2 7.9L20 19M8.2 16.1L20 5" />
    </>
  ),
};

export type IconName = keyof typeof P;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}

/* شعار FileTools */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="14" fill="var(--teal)" />
      <path
        d="M20 14h16l10 10v26a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z"
        fill="var(--surface)"
        stroke="var(--line)"
        strokeWidth="1"
      />
      <path d="M36 14l10 10H38a2 2 0 0 1-2-2z" fill="var(--teal-soft)" />
      <path
        d="M16 40l8-9 6 6 6-8 12 13v6a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z"
        fill="var(--teal)"
      />
      <circle cx="44" cy="45" r="4.5" fill="var(--amber)" />
    </svg>
  );
}
