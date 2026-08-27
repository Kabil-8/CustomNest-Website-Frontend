import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Leaf, Award, ArrowRight, ShieldCheck, Star, Gift, CheckCircle2 } from 'lucide-react';
import { Eyebrow, StitchDivider } from '../components/ui';

// ReactBits Components
import { ThreadParticles } from '../components/reactbits/ThreadParticles';
import { ShinyText } from '../components/reactbits/ShinyText';
import { BlurText } from '../components/reactbits/BlurText';
import { MagneticButton } from '../components/reactbits/MagneticButton';

const VALUES = [
  {
    icon: Heart,
    title: '100% Machine-Free Craft',
    desc: 'Every piece is hand-stitched with patience and precision, never mass-produced by industrial looms.',
  },
  {
    icon: Sparkles,
    title: 'Everlasting Beauty',
    desc: 'Our premium crochet flowers and resin keepsakes never wilt, fade, or lose their charm over time.',
  },
  {
    icon: Leaf,
    title: 'Eco-Minded Small Batches',
    desc: 'We minimize yarn waste by weaving strictly in small batches or to your exact bespoke order.',
  },
  {
    icon: Award,
    title: 'Personalized Keepsakes',
    desc: 'Your custom vision — from character plushies to memory frames — crafted into a one-of-a-kind gift.',
  },
];

const STATS = [
  { value: '500+', label: 'Happy Nests Delivered' },
  { value: '21+', label: 'Craft Categories' },
  { value: '4.9★', label: 'Customer Rating' },
  { value: '100%', label: 'Handcrafted With Love' },
];

const GALLERY = [
  {
    title: 'Special Combo Bouquet',
    category: 'Bouquets',
    image: '/images/products/special-combo-bouquets/special-combo-bouquets-01.jpg',
  },
  {
    title: 'Resin Memory Frame #4',
    category: 'Resin Frames',
    image: '/images/products/resin-frames/resin-frames-04.jpg',
  },
  {
    title: 'Cozy Bunny Plushie',
    category: 'Plushies',
    image: '/images/products/plushies/plushies-02.jpg',
  },
  {
    title: 'Jumbo Flower Bouquet',
    category: 'Jumbo Flowers',
    image: '/images/products/jumbo-flower-bouquets/jumbo-flower-bouquets-01.jpg',
  },
];

export default function About() {
  return (
    <div className="relative overflow-x-hidden min-h-screen bg-gradient-to-b from-rose-50/40 via-cream to-cream">
      {/* Background Yarn Thread Waves */}
      <ThreadParticles className="opacity-50 pointer-events-none" />

      {/* Hero Brand Story Section */}
      <section className="relative pt-10 pb-12 sm:pt-16 sm:pb-20 overflow-hidden z-10">
        <div className="container-nest max-w-full px-4 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 flex flex-col justify-center text-left"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="eyebrow bg-white/90 border border-rose-200 px-3.5 py-1 rounded-full shadow-soft backdrop-blur-sm">
                  <Sparkles size={13} className="text-rose-500 animate-pulse" />
                  Our Story & Craftsmanship
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-charcoal leading-[1.08] mt-1 mb-5">
                Handmade with Heart,{' '}
                <ShinyText text="Stitch by Stitch." className="font-display font-bold" />
              </h1>

              <div className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl mb-6">
                <BlurText
                  text="TheCustomNest began with a simple love for yarn, color, and the quiet satisfaction of making something truly special by hand. What started as a small passion grew into a nest of handmade crochet creations — bouquets that never wilt, plushies with personality, and resin keepsakes made for life’s sweetest moments."
                  delay={0.1}
                />
              </div>

              <p className="text-muted text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                We believe handmade things carry a spirit that mass production cannot replicate — patience, warmth, and genuine human intention woven into every loop.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <MagneticButton strength={0.15}>
                  <Link to="/shop" className="btn-primary py-3.5 px-7 text-base shadow-lift group">
                    Explore Our Collection
                    <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </MagneticButton>

                <MagneticButton strength={0.12}>
                  <Link to="/custom-order" className="btn-secondary py-3.5 px-6 text-base border-rose-300">
                    Start Custom Order
                  </Link>
                </MagneticButton>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-line/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-rose-500 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal">100% Handmade</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-rose-500 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal">4.9 Star Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-rose-500 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal">Pan-India Delivery</span>
                </div>
              </div>

              <StitchDivider className="mt-8 opacity-60" width={160} />
            </motion.div>

            {/* Right Visual Collage - Dual Flagship Cards (Fit Screen) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-5 relative grid grid-cols-2 gap-4 max-w-full"
            >
              <div className="relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-ivory shadow-card border border-rose-100/80">
                <img
                  src="/images/products/special-combo-bouquets/special-combo-bouquets-01.jpg"
                  alt="Special Combo Bouquet"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                  <p className="text-[11px] font-bold text-white truncate">Special Combo Bouquet</p>
                </div>
              </div>

              <div className="relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-ivory shadow-card border border-rose-100/80 mt-6 sm:mt-8">
                <img
                  src="/images/products/resin-frames/resin-frames-04.jpg"
                  alt="Resin Photo Frame #4"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                  <p className="text-[11px] font-bold text-white truncate">Resin Frame #4</p>
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lift px-5 py-3 flex items-center gap-3 border border-rose-200 z-20 whitespace-nowrap">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-charcoal">500+ Nests Created</p>
                  <p className="text-[11px] text-muted">Trusted across India</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-10 border-y border-line bg-ivory/80 backdrop-blur-sm relative z-10">
        <div className="container-nest max-w-full px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-3"
              >
                <p className="font-display text-3xl sm:text-4xl text-rose-600 font-bold mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm font-semibold text-charcoal">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="section relative z-10">
        <div className="container-nest max-w-full px-4 sm:px-8">
          <div className="text-center max-w-lg mx-auto mb-12">
            <Eyebrow>
              <span className="mx-auto">Our Principles</span>
            </Eyebrow>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">What We Stand For</h2>
            <p className="text-muted text-sm mt-2">Every piece is guided by these core craft values.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-line/80 shadow-soft hover:shadow-lift hover:border-rose-300 transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <v.icon size={22} />
                </div>
                <h3 className="font-display text-lg text-charcoal mb-2">{v.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Showcase Gallery */}
      <section className="section bg-ivory/50 relative z-10">
        <div className="container-nest max-w-full px-4 sm:px-8">
          <div className="text-center max-w-lg mx-auto mb-10">
            <Eyebrow>
              <span className="mx-auto">Craftsmanship Showcase</span>
            </Eyebrow>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">Featured Creations</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {GALLERY.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-charcoal border border-line shadow-card"
              >
                <img
                  src={g.image}
                  alt={g.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block mb-0.5">
                    {g.category}
                  </span>
                  <p className="font-display text-sm sm:text-base font-semibold leading-tight drop-shadow-sm">{g.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="section relative z-10">
        <div className="container-nest max-w-full px-4 sm:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-charcoal p-10 sm:p-16 text-center max-w-3xl mx-auto shadow-lift">
            <Eyebrow>
              <span className="text-rose-300 mx-auto">Have an idea in mind?</span>
            </Eyebrow>
            <h2 className="font-display text-3xl sm:text-5xl text-cream mt-4 mb-4 leading-tight">
              Let's Create Something Personal
            </h2>
            <p className="text-cream/70 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Whether it's a bouquet for a special date, a plushie of a beloved pet, or a resin frame for a memory — we'd love to craft it for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <MagneticButton strength={0.15}>
                <Link to="/custom-order" className="btn-primary py-3.5 px-7">
                  Start a Custom Order <ArrowRight size={16} />
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
