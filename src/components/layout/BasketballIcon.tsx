import React from 'react';
import { cn } from '@/lib/utils';

export const BasketballIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 50 50" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn(className)}
    >
      <defs>
        <radialGradient id="ballGradient" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f8b400" />
            <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <circle cx="25" cy="25" r="24" fill="url(#ballGradient)"/>
      <path d="M 25 1 V 49" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M 1,25 A 35 35 0 0 1 49,25" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M 1,25 A 35 35 0 0 0 49,25" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  );
};
