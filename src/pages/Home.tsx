import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { CategoryShowcase } from '../components/home/CategoryShowcase';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { HandmadeStorySection } from '../components/home/HandmadeStorySection';
import { WhyTheCustomNestSection } from '../components/home/WhyTheCustomNestSection';
import { CustomOrderSection } from '../components/home/CustomOrderSection';
import { NewsletterSection } from '../components/home/NewsletterSection';

export default function Home() {
  return (
    <div className="space-y-4 pb-12">
      <HeroSection />
      <CategoryShowcase />
      <FeaturedProductsSection />
      <HandmadeStorySection />
      <WhyTheCustomNestSection />
      <CustomOrderSection />
      <NewsletterSection />
    </div>
  );
}
