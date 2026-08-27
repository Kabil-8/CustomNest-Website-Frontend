import React from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { Heart, Star } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-3xl border border-line shadow-lift overflow-hidden"
        >
          {/* Left Visual Banner */}
          <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 min-h-[480px] bg-charcoal text-cream overflow-hidden">
            <img
              src="/images/categories/jumbo-flower-bouquets.jpg"
              alt="Handmade crochet flowers"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/50 to-charcoal/30" />

            <div className="relative z-10">
              <span className="eyebrow text-rose-300">TheCustomNest</span>
            </div>

            <div className="relative z-10 my-auto">
              <div className="flex items-center gap-1 text-amber-400 mb-2 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
                <span className="text-cream/80 ml-1.5 font-medium">4.9 / 5 Rating</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl leading-snug mb-2 text-cream font-bold">
                Handmade pieces, <br />
                <span className="text-rose-300 font-serif italic">crafted with love.</span>
              </h2>
              <p className="text-cream/70 text-xs leading-relaxed max-w-xs">
                Discover artisan crochet bouquets, custom gifts, and cozy home decor created for your special moments.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2.5 pt-4 border-t border-white/10 text-xs text-cream/70">
              <Heart size={14} className="text-rose-400 shrink-0" />
              <span>Over 500+ handcrafted pieces delivered</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex items-center justify-center">
            <LoginForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
