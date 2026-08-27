import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { AnimatedContent } from '../reactbits/AnimatedContent';

export function HandmadeStorySection() {
  return (
    <section className="bg-white border-y border-line py-16 sm:py-20">
      <div className="container-nest">
        <AnimatedContent>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Story Visual Banner */}
            <div className="lg:col-span-6 aspect-video sm:aspect-[4/3] rounded-3xl overflow-hidden border border-line shadow-soft bg-ivory">
              <img
                src="/images/categories/single-flowers.jpg"
                alt="Crochet artisan crafting process"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Story Text Column */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="eyebrow mb-1">OUR CRAFT & PASSION</span>
                <h2 className="font-display text-3xl sm:text-4xl text-charcoal leading-tight">
                  Crafted thread by thread, with love in every stitch.
                </h2>
              </div>

              <p className="text-muted text-sm sm:text-base leading-relaxed">
                Every single piece in TheCustomNest is individually hand-crocheted using high-quality milk cotton yarn. We believe in slow, intentional crafting that results in gifts that last forever.
              </p>

              {/* Three Craftsmanship Principles */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-charcoal">Thoughtfully Made</h3>
                    <p className="text-xs text-muted">Every piece is crocheted by hand with precision and care.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-charcoal">Made to Personalize</h3>
                    <p className="text-xs text-muted">Colors, details, and custom requests can make each piece uniquely yours.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-charcoal">Made to Last</h3>
                    <p className="text-xs text-muted">We choose durable, washable, high-quality materials with care.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Link to="/about" className="btn-secondary py-3 px-6 text-sm">
                  <span>Read Our Full Story</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
