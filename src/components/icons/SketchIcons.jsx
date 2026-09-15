import React from 'react';

/**
 * Hand-drawn/doodle-style line icons (single stroke colour, slightly
 * imperfect paths) — used in place of emoji for a more deliberate,
 * illustrated look on selection cards (student support types, etc.).
 * All share the same 0 0 48 48 viewBox, stroke="currentColor", fill="none"
 * so they inherit whatever text colour the parent sets and scale together.
 */
const base = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function ScholarshipCapIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 17.5 23.6 9c.3-.1.6-.1.9 0L44 17.5 24.4 26c-.3.1-.6.1-.9 0L4 17.5Z" />
      <path d="M13 21.3v8.4c0 1 2.2 4.8 11 4.8s11-3.8 11-4.8v-8.4" />
      <path d="M39.5 19.3v10.4" />
      <path d="M39.5 29.7c-1.1 1.4-1.1 3.3 0 4.7" />
    </svg>
  );
}

export function EducationLoanIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 13.4h37c.6 0 1 .5 1 1v19c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-19c0-.5.4-1 1-1Z" />
      <path d="M4.3 19.6h38.6" />
      <path d="M10 28.5h8.3" />
      <path d="M10 32.2h5" />
      <path d="M30 27.5c1.2-1 3-1.6 4.6-1 1.7.6 2.6 2.5 2 4.2-.6 1.5-2.2 2.1-3.6 2.7-1.5.6-3 1.3-3.5 2.8h7.9" />
    </svg>
  );
}

export function CoachingBooksIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 36V11.6c0-.9.7-1.6 1.6-1.7l10-.9c.6 0 1 .4 1 1V38c0 .6-.5 1-1 1l-10-.9c-.9 0-1.6-.8-1.6-1.7Z" />
      <path d="M41 36V11.6c0-.9-.7-1.6-1.6-1.7l-10-.9c-.6 0-1 .4-1 1V38c0 .6.5 1 1 1l10-.9c.9 0 1.6-.8 1.6-1.7Z" />
      <path d="M19.6 10.2v27.8" />
      <path d="M28.4 10.2v27.8" />
      <path d="M11.5 17.5l6-.6" />
      <path d="M11.5 23.7l6-.5" />
      <path d="M30.5 17l6 .5" />
      <path d="M30.5 23.2l6 .5" />
    </svg>
  );
}

export function HostelHomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 22 23.4 8.3c.4-.3 1-.3 1.4 0L41.5 22" />
      <path d="M11 19v18.2c0 .6.5 1 1 1h24c.6 0 1-.4 1-1V19" />
      <path d="M20 38.2V27.6c0-.5.4-1 1-1h6c.5 0 1 .5 1 1v10.6" />
      <path d="M17.5 8.6V4.8h4.3" />
    </svg>
  );
}

export function OverseasGlobeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M24 41.4c9.6 0 17.4-7.8 17.4-17.4S33.6 6.6 24 6.6 6.6 14.4 6.6 24 14.4 41.4 24 41.4Z" />
      <path d="M6.6 24h34.8" />
      <path d="M24 6.6c4.2 4.6 6.5 10.6 6.5 17.4S28.2 36.8 24 41.4c-4.2-4.6-6.5-10.6-6.5-17.4S19.8 11.2 24 6.6Z" />
      <path d="M9.6 15.8c3.7 2 9 3.2 14.4 3.2s10.7-1.2 14.4-3.2" />
      <path d="M9.6 32.2c3.7-2 9-3.2 14.4-3.2s10.7 1.2 14.4 3.2" />
    </svg>
  );
}

/* ---- Business flow icons ---- */

export function AgricultureIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M24 42V17c0-6 4-11 10-13-1 6-4 10-10 12" />
      <path d="M24 26c0-6-4.5-10.5-11-12 1 6 4.5 10 11 12Z" />
      <path d="M24 33c0-5 3.6-8.7 9-10-.8 5-3.6 8.5-9 10Z" />
      <path d="M9 42h30" />
    </svg>
  );
}

export function ManufacturingIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 42V24l10 7v-7l10 7v-7l10 7v11" />
      <path d="M6 42h30" />
      <path d="M40 24v-6h4v6" />
      <path d="M42 18v-6" />
    </svg>
  );
}

export function RetailTradingIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 16h30l-3 20c-.1.9-.9 1.6-1.8 1.6H13.8c-.9 0-1.7-.7-1.8-1.6L9 16Z" />
      <path d="M16 16v-2c0-4.4 3.6-8 8-8s8 3.6 8 8v2" />
      <path d="M16 22c0 3 2 5.5 8 5.5" />
    </svg>
  );
}

export function FoodProcessingIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20c0-6.6 5.4-12 12-12s12 5.4 12 12" />
      <path d="M8 20h32c.6 0 1 .5.9 1.1-1 8-8.3 15-16.9 15S9 29.1 8 21.1C7.9 20.5 7.4 20 8 20Z" />
      <path d="M18 38.5h12" />
    </svg>
  );
}

export function TechItIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 12.5c0-1 .8-1.8 1.8-1.8h32.4c1 0 1.8.8 1.8 1.8V30c0 1-.8 1.8-1.8 1.8H7.8c-1 0-1.8-.8-1.8-1.8V12.5Z" />
      <path d="M18 38h12" />
      <path d="M20.5 31.8 19 38" />
      <path d="M27.5 31.8 29 38" />
      <path d="M14 17.5l-3.5 3.6L14 24.6" />
      <path d="M22 16l-3 10" />
      <path d="M28 17.5l3.5 3.6-3.5 3.5" />
    </svg>
  );
}

export function TransportIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 30V17c0-1 .8-1.8 1.8-1.8h20.4c1 0 1.8.8 1.8 1.8v13" />
      <path d="M28 21h8.5c.6 0 1.2.3 1.5.9l3 5.4c.2.3.3.7.3 1v1.7c0 1-.8 1.8-1.8 1.8H28" />
      <path d="M4 30h2" />
      <path d="M12.5 34.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M32 34.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M29.5 25h6.5" />
    </svg>
  );
}

export function TourismIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 42V13c0-1 .8-1.8 1.8-1.8h16.4c1 0 1.8.8 1.8 1.8v29" />
      <path d="M9 42h27" />
      <path d="M32 24h6c1 0 1.8.8 1.8 1.8V42" />
      <path d="M15 18h4M23 18h4M15 25h4M23 25h4M15 32h4M23 32h4" />
      <path d="M20 42v-7c0-1.1.9-2 2-2s2 .9 2 2v7" />
    </svg>
  );
}

export function HandicraftsIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M24 6.5a8 8 0 0 1 8 8c0 3.6-1.7 5.7-3.2 7.5-1 1.2-1.8 2.2-1.8 3.5v2H21v-2c0-1.3-.8-2.3-1.8-3.5-1.5-1.8-3.2-3.9-3.2-7.5a8 8 0 0 1 8-8Z" />
      <path d="M20 31.5h8" />
      <path d="M21 36h6" />
      <path d="M9 40c3-2.4 6.7-3.7 11-3.7h8c4.3 0 8 1.3 11 3.7" />
    </svg>
  );
}

export function HealthcareIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 8v9c0 3.9 3.1 7 7 7s7-3.1 7-7V8" />
      <path d="M13 8h8M31 8h4" />
      <path d="M35 12v6a11 11 0 0 1-22 0" />
      <path d="M35 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M24 24v9M19.5 28.5h9" />
    </svg>
  );
}

export function OtherServicesIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M27.2 8.4a3.7 3.7 0 0 1 5.2 5.2L14.6 31.4 8 34l2.6-6.6L27.2 8.4Z" />
      <path d="M24 12.4l4.4 4.4" />
      <path d="M9 40h30" />
    </svg>
  );
}

export function NewIdeaIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 24c0-4 3-8 7-8s7 4 7 8c0 3-1.6 4.7-3 6.2-.8.9-1.5 1.7-1.5 2.8H21.5c0-1.1-.7-1.9-1.5-2.8-1.4-1.5-3-3.2-3-6.2Z" />
      <path d="M20.5 36.5h7" />
      <path d="M21.5 40.5h5" />
      <path d="M24 5.5v3M9 24h3M36 24h3M13 12l2.2 2.2M35 12l-2.2 2.2" />
    </svg>
  );
}

export function ExistingShopIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 18l2-8.4c.2-.9 1-1.6 2-1.6h28c1 0 1.8.7 2 1.6L42 18" />
      <path d="M6 18v1.5a4.5 4.5 0 0 0 9 0 4.5 4.5 0 0 0 9 0 4.5 4.5 0 0 0 9 0 4.5 4.5 0 0 0 9 0V18" />
      <path d="M8.5 21.5V40h31V21.5" />
      <path d="M19 40V29c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v11" />
    </svg>
  );
}

export function ExpansionGrowthIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 40h36" />
      <path d="M6 33 17 22l7 7 15-15" />
      <path d="M31 14h8v8" />
    </svg>
  );
}
