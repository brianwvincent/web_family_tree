
import React from 'react';

const TreeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 22v-3" />
    <path d="M10 19H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
    <path d="M14 19h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
    <path d="M12 7V2" />
    <path d="M7 5h10" />
    <path d="M12 12h-2" />
    <path d="M12 12h2" />
  </svg>
);

export default TreeIcon;
