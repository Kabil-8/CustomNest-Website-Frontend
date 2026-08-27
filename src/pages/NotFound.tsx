import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StitchDivider } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container-nest py-24 flex flex-col items-center text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="font-display text-7xl text-rose-300 mb-4">404</p>
        <h1 className="font-display text-3xl mb-3">Oops! This little nest is empty.</h1>
        <p className="text-muted max-w-sm mx-auto mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <StitchDivider className="mx-auto mb-8" width={120} />
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
