import React from 'react';
import { Heart, Sparkles, ShieldCheck, Gift } from 'lucide-react';
import { AnimatedContent } from '../reactbits/AnimatedContent';

export function WhyTheCustomNestSection() {
  const features = [
    {
      icon: Heart,
      title: 'Handmade with Care',
      description: 'Every piece receives individual attention and technique.',
    },
    {
      icon: Sparkles,
      title: 'Custom by Request',
      description: 'Turn your idea or photo into a handmade creation.',
    },
    {
      icon: ShieldCheck,
      title: 'Thoughtful Materials',
      description: 'Crafted with carefully selected, washable milk cotton yarn.',
    },
    {
      icon: Gift,
      title: 'For Meaningful Moments',
      description: 'Perfect for gifting, celebrating, and keeping forever.',
    },
  ];

  return (
    <section className="container-nest py-12">
      <AnimatedContent>
        <div className="text-center mb-10">
          <span className="eyebrow mb-1">OUR VALUES</span>
          <h2 className="font-display text-2xl sm:text-3xl text-charcoal">Why Choose TheCustomNest?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-line shadow-soft text-center space-y-3 hover:shadow-lift transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-base font-bold text-charcoal">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </AnimatedContent>
    </section>
  );
}
