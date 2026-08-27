import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedContentProps {
  children: React.ReactNode;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedContent({
  children,
  distance = 30,
  direction = 'vertical',
  reverse = false,
  duration = 0.5,
  delay = 0,
  className = '',
}: AnimatedContentProps) {
  const axis = direction === 'vertical' ? 'y' : 'x';
  const initialOffset = reverse ? -distance : distance;

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: initialOffset }}
      whileInView={{ opacity: 1, [axis]: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
