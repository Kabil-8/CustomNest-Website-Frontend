import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, ShieldCheck, Sparkles, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { BlurText } from '../reactbits/BlurText';
import { MagneticButton } from '../reactbits/MagneticButton';
import { SpotlightCard } from '../reactbits/SpotlightCard';

const TRUST_ITEMS = [
  { icon: Heart, title: 'Handcrafted', subtitle: 'Made with Care' },
  { icon: Sparkles, title: 'Customizable', subtitle: 'Made Your Way' },
  { icon: ShieldCheck, title: 'Thoughtful', subtitle: 'Created for Keeps' },
];

const HERO_SLIDES = [
  {
    src: '/images/categories/single-flowers.jpg',
    alt: 'Single Crochet Flower — handmade with love',
    label: 'Single Flower',
    category: 'single-flowers',
  },
  {
    src: '/images/categories/jumbo-flower-bouquets.jpg',
    alt: 'Jumbo Eternal Rose Bouquet — handmade crochet',
    label: 'Jumbo Bouquet',
    category: 'jumbo-flower-bouquets',
  },
  {
    src: '/images/categories/plushies.jpg',
    alt: 'Handcrafted Crochet Plushies',
    label: 'Plushies',
    category: 'plushies',
  },
  {
    src: '/images/categories/kids-toys-jumbo.jpg',
    alt: 'Crochet Kids Toys — fun and safe',
    label: 'Kids Toys',
    category: 'kids-toys-jumbo',
  },
  {
    src: '/images/categories/special-combo-bouquets.jpg',
    alt: 'Special Combo Bouquet — curated gift set',
    label: 'Special Combo',
    category: 'special-combo-bouquets',
  },
  {
    src: '/images/categories/flower-pots.jpg',
    alt: 'Crochet Flower Pot — home décor piece',
    label: 'Flower Pot',
    category: 'flower-pots',
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % HERO_SLIDES.length, 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1);
  }, [current, goTo]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next, paused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0]?.clientX;
    if (touchEnd !== undefined) {
      const diff = touchStart - touchEnd;
      if (diff > 40) {
        next();
      } else if (diff < -40) {
        prev();
      }
    }
    setTouchStart(null);
  };

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative bg-cream pt-8 pb-12 sm:pt-16 sm:pb-20 border-b border-line/40 overflow-hidden">
      {/* Ambient floating blobs — hidden on mobile to avoid clutter */}
      <motion.div
        aria-hidden
        className="hidden sm:block absolute -top-12 -left-12 w-64 h-64 rounded-full bg-rose-200/25 blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="hidden sm:block absolute top-1/2 -right-16 w-72 h-72 rounded-full bg-rose-300/15 blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="hidden lg:block absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-rose-100/30 blur-3xl"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container-nest relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">

          {/* ── Left Content Column ── */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-5 sm:space-y-6">

            {/* Eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="eyebrow text-[0.68rem] sm:text-xs tracking-[0.22em] uppercase font-bold text-rose-600 inline-block"
            >
              HANDCRAFTED • THOUGHTFUL • MADE TO LAST
            </motion.span>

            {/* Hero Heading */}
            <BlurText
              as="h1"
              text="Made by Hand. Made for You."
              delay={1}
              animateBy="words"
              className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl text-charcoal leading-[1.1] tracking-tight block"
            />

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="text-muted text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0"
            >
              Thoughtfully crocheted pieces made to bring warmth, charm, and a little something special to everyday moments.
            </motion.p>

            {/* ── Mobile Image Slider (Visible on Mobile / Tablet < lg) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="block lg:hidden my-3 relative rounded-2xl overflow-hidden shadow-lift border border-line bg-white text-left mx-auto max-w-md"
            >
              {/* Image Frame with Touch pan support */}
              <div
                className="aspect-[4/3] overflow-hidden bg-ivory relative touch-pan-y"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, x: direction * 35 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -35 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  />
                </AnimatePresence>

                {/* Prev / Next controls */}
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center text-charcoal hover:bg-white active:scale-95 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center text-charcoal hover:bg-white active:scale-95 transition"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {HERO_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i, i > current ? 1 : -1)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === current ? 'w-5 bg-rose-500' : 'w-1.5 bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile Slide Caption */}
              <div className="bg-white px-4 py-3 border-t border-line flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[0.58rem] font-bold text-rose-600 uppercase tracking-widest block mb-0.5">
                    FEATURED CREATION
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={slide.label}
                      className="font-display text-sm text-charcoal font-bold truncate"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                    >
                      {slide.label}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <Link
                  to={`/shop?category=${slide.category}`}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1 shrink-0"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>

            {/* Brand Quote */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
              className="relative pl-5 border-l-2 border-rose-300 text-left mx-auto lg:mx-0 max-w-sm"
            >
              <Quote size={14} className="text-rose-300 absolute -top-1 -left-1 rotate-180" />
              <p className="text-sm sm:text-base italic text-rose-700/80 font-medium leading-relaxed font-display">
                "Every loop is an act of love — handmade to be cherished, gifted, and remembered."
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1"
            >
              <Link to="/shop">
                <MagneticButton className="btn-primary py-3.5 px-7 sm:py-4 sm:px-8 text-sm shadow-soft hover:shadow-lift flex items-center gap-2">
                  <span>Shop the Collection →</span>
                </MagneticButton>
              </Link>
              <Link to="/custom-order" className="btn-secondary py-3.5 px-7 sm:py-4 sm:px-8 text-sm">
                Create Something Custom
              </Link>
            </motion.div>

            {/* Trust Cards — staggered */}
            <div className="pt-6 sm:pt-8 border-t border-line/60 grid grid-cols-3 gap-2 sm:gap-4">
              {TRUST_ITEMS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.42 + i * 0.09 }}
                >
                  <SpotlightCard className="p-2.5 sm:p-3.5 h-full flex flex-col items-center lg:items-start gap-1.5 text-center lg:text-left">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                      <item.icon size={15} />
                    </div>
                    <span className="font-display text-xs sm:text-sm font-bold text-charcoal leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[0.6rem] sm:text-xs text-muted leading-tight">{item.subtitle}</span>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Right Hero Visual (Desktop Only: hidden lg:block) ── */}
          <div className="hidden lg:block lg:col-span-6 relative mt-4 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lift border border-line bg-white flex flex-col mx-auto"
              style={{ maxWidth: '520px' }}
            >
              {/* Slider Image */}
              <div
                className="aspect-[4/3] sm:aspect-[3/2] overflow-hidden bg-ivory relative"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, x: direction * 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -40 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                  />
                </AnimatePresence>

                {/* Prev / Next arrows */}
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-charcoal hover:bg-white transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-charcoal hover:bg-white transition"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {HERO_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i, i > current ? 1 : -1)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === current ? 'w-5 bg-rose-500' : 'w-1.5 bg-white/70 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Caption Panel — animates with slide */}
              <div className="bg-white px-5 py-4 border-t border-line flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[0.6rem] sm:text-[0.65rem] font-bold text-rose-600 uppercase tracking-widest block mb-0.5">
                    FEATURED CREATION
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={slide.label}
                      className="font-display text-sm sm:text-base text-charcoal font-bold truncate"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                    >
                      {slide.label}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <Link
                  to={`/shop?category=${slide.category}`}
                  className="btn-primary text-xs py-2.5 px-4 sm:px-5 flex items-center gap-1.5 shrink-0"
                >
                  <span>Explore</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>

            {/* Floating "Made with love" badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              whileHover={{ rotate: 0, scale: 1.06 }}
              className="hidden md:flex absolute -top-5 -left-5 items-center gap-1.5 bg-white shadow-soft border border-rose-100 rounded-2xl px-3.5 py-2.5 cursor-default"
            >
              <Heart size={13} className="text-rose-500 fill-rose-500" />
              <span className="text-[0.65rem] font-semibold text-charcoal">Made with love</span>
            </motion.div>

            {/* Floating "Custom Orders" badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 5 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              whileHover={{ rotate: 0, scale: 1.06 }}
              className="hidden md:flex absolute -bottom-4 -right-4 items-center gap-1.5 bg-white shadow-soft border border-rose-100 rounded-2xl px-3.5 py-2.5 cursor-default"
            >
              <Sparkles size={13} className="text-rose-500" />
              <span className="text-[0.65rem] font-semibold text-charcoal">Custom Orders Open</span>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}