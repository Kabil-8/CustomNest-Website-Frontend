import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { MagneticButton } from '../reactbits/MagneticButton';

export function CustomOrderSection() {
  return (
    <section className="container-nest py-12">
      <AnimatedContent>
        <div className="bg-white rounded-3xl border border-line shadow-lift overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Visual Banner */}
          <div className="lg:col-span-6 aspect-video lg:aspect-auto lg:h-full overflow-hidden bg-ivory">
            <img
              src="/images/categories/customised-gifts.jpg"
              alt="Custom handmade crochet gift"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-6 p-8 sm:p-12 space-y-5">
            <span className="eyebrow text-xs">BESPOKE CREATIONS</span>
            <h2 className="font-display text-3xl sm:text-4xl text-charcoal">Your Idea. Our Craft.</h2>
            <p className="text-muted text-sm sm:text-base leading-relaxed max-w-lg">
              Have something special in mind? Share your colors, inspiration and vision, and we'll help turn it into a one-of-a-kind crochet creation.
            </p>

            <div className="pt-3">
              <Link to="/custom-order">
                <MagneticButton className="btn-primary py-3.5 px-8 text-sm flex items-center gap-2">
                  <span>Start a Custom Order</span>
                  <ArrowRight size={16} />
                </MagneticButton>
              </Link>
            </div>
          </div>
        </div>
      </AnimatedContent>
    </section>
  );
}
