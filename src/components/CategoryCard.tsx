import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { Collection } from '../types';

export function CategoryCard({ collection, index = 0 }: { collection: Collection; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Link
        to={`/shop?collection=${collection.slug}`}
        className="group relative flex flex-col rounded-2xl overflow-hidden bg-ivory border border-line hover:shadow-lift transition-shadow duration-300"
      >
        <div className="relative aspect-[5/4] overflow-hidden">
          <img
            src={collection.image}
            alt={collection.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/45 via-transparent to-transparent" />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-display text-lg">{collection.name}</h3>
            <p className="text-xs text-muted mt-0.5">{collection.tagline}</p>
          </div>
          <span className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
