import React from 'react';
import { motion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordDelay?: number;
  animateBy?: 'words' | 'letters';
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span';
}

export function BlurText({
  text,
  className = '',
  delay = 0,
  wordDelay = 0.06,
  as: Component = 'div',
}: BlurTextProps) {
  const words = text.split(' ');

  return (
    <Component className={`block ${className}`}>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 12 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + idx * wordDelay,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

export default BlurText;
