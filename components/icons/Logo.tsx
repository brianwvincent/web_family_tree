import React from 'react';

const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="48" fill="#0D2444" stroke="#E6B33D" strokeWidth="1"/>
    
    {/* Trunk */}
    <path d="M50 98 V 70" stroke="#E6B33D" strokeWidth="3" fill="none" />
    
    {/* Main Branches */}
    <path d="M50 70 L 35 55" stroke="#E6B33D" strokeWidth="2.5" fill="none" />
    <path d="M50 70 L 65 55" stroke="#E6B33D" strokeWidth="2.5" fill="none" />
    
    <path d="M35 55 L 25 40" stroke="#E6B33D" strokeWidth="2" fill="none" />
    <path d="M35 55 L 45 40" stroke="#E6B33D" strokeWidth="2" fill="none" />
    
    <path d="M65 55 L 55 40" stroke="#E6B33D" strokeWidth="2" fill="none" />
    <path d="M65 55 L 75 40" stroke="#E6B33D" strokeWidth="2" fill="none" />
    
    <path d="M45 40 L 45 25" stroke="#E6B33D" strokeWidth="1.5" fill="none" />
    <path d="M55 40 L 55 25" stroke="#E6B33D" strokeWidth="1.5" fill="none" />
    
    <path d="M45 25 L 55 25" stroke="#E6B33D" strokeWidth="1.5" fill="none" />
    <path d="M50 25 V 15" stroke="#E6B33D" strokeWidth="1.5" fill="none" />
    
    {/* Nodes */}
    <circle cx="50" cy="70" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="35" cy="55" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="65" cy="55" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="25" cy="40" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="45" cy="40" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="55" cy="40" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="75" cy="40" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="45" cy="25" r="4" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="55" cy="25" r="4" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />
    <circle cx="50" cy="15" r="5" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1.5" />

    {/* Small decorative nodes */}
    <circle cx="28" cy="75" r="3" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1" />
    <path d="M50 85 L 28 75" stroke="#E6B33D" strokeWidth="1" fill="none" />
    <circle cx="72" cy="75" r="3" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1" />
    <path d="M50 85 L 72 75" stroke="#E6B33D" strokeWidth="1" fill="none" />

    <circle cx="18" cy="52" r="3" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1" />
    <path d="M35 65 L 18 52" stroke="#E6B33D" strokeWidth="1" fill="none" />
    <circle cx="82" cy="52" r="3" fill="#61D4C3" stroke="#E6B33D" strokeWidth="1" />
    <path d="M65 65 L 82 52" stroke="#E6B33D" strokeWidth="1" fill="none" />
  </svg>
);
export default Logo;
