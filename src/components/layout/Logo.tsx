import React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: "rgb(126, 34, 206)", stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: "rgb(219, 39, 119)", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "rgb(234, 88, 12)", stopOpacity: 1 }} />
      </linearGradient>
      <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.15" />
      </filter>
    </defs>
    <g filter="url(#soft-shadow)">
      <circle cx="40" cy="40" r="30" fill="#f97316"/>
      <path d="M40 10 V 70" stroke="#ffedd5" strokeWidth="3.5" />
      <path d="M20 40 C 20 25, 30 22, 40 22" stroke="#ffedd5" strokeWidth="3.5" fill="none" />
      <path d="M60 40 C 60 55, 50 58, 40 58" stroke="#ffedd5" strokeWidth="3.5" fill="none" />
    </g>
    <text style={{fontFamily: "'Arial Black', Gadget, sans-serif", letterSpacing: "1px"}} fill="url(#grad1)" fontSize="28" fontWeight="900" y="36" x="90">HOOP</text>
    <text style={{fontFamily: "'Arial Black', Gadget, sans-serif", letterSpacing: "1px"}} fill="url(#grad1)" fontSize="28" fontWeight="900" y="66" x="90">CONTROL</text>
  </svg>
);

export default Logo;
