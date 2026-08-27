import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export interface HeroImageSlide {
  id: string;
  title: string;
  category: string;
  src: string;
  badge?: string;
  price?: string;
}

interface TiltedCardProps {
  slides: HeroImageSlide[];
  activeIndex: number;
  onSelectSlide: (index: number) => void;
  className?: string;
}

export function TiltedCard({ slides, activeIndex, onSelectSlide, className = '' }: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for smooth, low-sensitivity tilt physics
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Subtle tilt range (+/- 2.5 deg) for smooth interaction without causing layout shift or overflow
  const rotateXSpring = useSpring(useTransform(mouseY, [0, 1], [2.5, -2.5]), {
    stiffness: 100,
    damping: 22,
  });
  const rotateYSpring = useSpring(useTransform(mouseX, [0, 1], [-2.5, 2.5]), {
    stiffness: 100,
    damping: 22,
  });

  // Spotlight reflection movement
  const spotlightX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const spotlightY = useTransform(mouseY, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const currentSlide = slides[activeIndex] || slides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectSlide((activeIndex - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectSlide((activeIndex + 1) % slides.length);
  };

  return (
    <div className={`relative select-none max-w-full w-full ${className}`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full max-w-full rounded-2xl sm:rounded-[2rem] bg-white p-2.5 sm:p-4 shadow-card hover:shadow-lift transition-shadow duration-300 border border-line/80 group cursor-pointer overflow-hidden sm:overflow-visible"
      >
        {/* ReactBits Dynamic Spotlight Layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30"
          style={{
            background: `radial-gradient(400px circle at ${spotlightX.get()} ${spotlightY.get()}, rgba(243, 210, 203, 0.25), transparent 50%)`,
          }}
        />

        {/* Main Image Frame - Mobile responsive heights */}
        <div className="relative aspect-[4/5] h-[340px] sm:h-[440px] lg:h-[480px] w-full rounded-xl sm:rounded-[1.5rem] overflow-hidden bg-ivory shadow-inner">
          {slides.map((slide, idx) => (
            <motion.img
              key={slide.id}
              src={slide.src}
              alt={slide.title}
              initial={false}
              animate={{
                opacity: idx === activeIndex ? 1 : 0,
                scale: idx === activeIndex ? (isHovered ? 1.03 : 1) : 1.05,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          ))}

          {/* Deep dark gradient overlay at bottom for crisp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity" />

          {/* Floating Top-Right Badge inside image frame */}
          <div
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl shadow-md px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 z-20 border border-white/60"
            style={{ transform: 'translateZ(12px)' }}
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Sparkles size={13} />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-charcoal leading-tight">100% Handcrafted</p>
              <p className="text-[9px] sm:text-[10px] text-muted leading-none">Small batch yarn</p>
            </div>
          </div>

          {/* Quick Category & Title Info Overlay - High Contrast & Crystal Clear Text */}
          <div
            className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 transition-transform duration-300"
            style={{ transform: 'translateZ(18px)' }}
          >
            <div className="bg-black/50 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-white/15 shadow-lift">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-rose-500/95 text-white px-2 py-0.5 rounded-full shadow-sm">
                  <Sparkles size={10} /> {currentSlide.category}
                </span>
                {currentSlide.price && (
                  <span className="text-[11px] sm:text-xs font-bold bg-white/20 text-white backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/30">
                    {currentSlide.price}
                  </span>
                )}
              </div>
              <h3 className="font-display text-base sm:text-xl font-bold leading-tight !text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] truncate">
                {currentSlide.title}
              </h3>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous showcase product"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-charcoal flex items-center justify-center shadow-md backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-30 active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next showcase product"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-charcoal flex items-center justify-center shadow-md backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-30 active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Thumbnails Row - Mobile responsive horizontal scroll without container blowout */}
        <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-2 px-0.5 max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 max-w-full scrollbar-none snap-x">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSlide(idx);
                }}
                className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 snap-start ${
                  idx === activeIndex
                    ? 'border-rose-500 scale-105 shadow-sm'
                    : 'border-transparent opacity-65 hover:opacity-100'
                }`}
              >
                <img src={s.src} alt={s.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-muted shrink-0 bg-sand/60 px-2 py-1 rounded-lg">
            <Eye size={12} className="text-rose-500" />
            <span>Interactive 3D</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
