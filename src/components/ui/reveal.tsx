'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function Reveal({ 
  children, 
  delay = 0, 
  direction = 'up',
  hover = false
}: { 
  children: ReactNode; 
  delay?: number; 
  direction?: 'up' | 'down' | 'left' | 'right';
  hover?: boolean;
}) {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      whileHover={
        hover 
          ? { scale: 1.02, y: -5, transition: { duration: 0.2, delay: 0 } } 
          : undefined
      }
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.7, 
        delay: delay, 
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      style={{ cursor: hover ? 'pointer' : 'inherit' }}
    >
      {children}
    </motion.div>
  );
}