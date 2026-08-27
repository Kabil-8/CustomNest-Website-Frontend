import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export function DecryptedText({ text, speed = 40, className = '' }: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`font-mono ${className}`}>
      {displayText}
    </motion.span>
  );
}
