import React from 'react';
import { motion } from 'framer-motion';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Sparkles } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-6 sm:py-10 px-4 bg-cream/20">
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
              src="/images/categories/customised-gifts.jpg"
              alt="Handmade crochet gift"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/50 to-charcoal/30" />

            <div className="relative z-10">
              <span className="eyebrow text-rose-300">TheCustomNest</span>
            </div>

            <div className="relative z-10 my-auto">
              <h2 className="font-display text-2xl sm:text-3xl leading-snug mb-2 text-cream font-bold">
                Made by Hand. <br />
                <span className="text-rose-300 font-serif italic">Made for You.</span>
              </h2>
              <p className="text-cream/70 text-xs leading-relaxed max-w-xs">
                Join our community to unlock custom order requests, save your favorite pieces, and experience boutique shopping.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2.5 pt-4 border-t border-white/10 text-xs text-cream/70">
              <Sparkles size={14} className="text-rose-400 shrink-0" />
              <span>Free customer account with instant access</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex items-center justify-center">
            <RegisterForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
