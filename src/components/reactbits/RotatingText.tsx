import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface RotatingTextProps {
  words: string[];
  interval?: number;
  className?: string;
  wordClassName?: string;
}

export function RotatingText({
  words,
  interval = 2800,
  className = '',
  wordClassName = 'text-rose-500 font-display',
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span className={`inline-inline-flex relative overflow-hidden align-bottom px-1 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 28, opacity: 0, filter: 'blur(8px)', rotateX: -45 }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)', rotateX: 0 }}
          exit={{ y: -28, opacity: 0, filter: 'blur(8px)', rotateX: 45 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className={`inline-block whitespace-nowrap ${wordClassName}`}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
