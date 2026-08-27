import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Eyebrow } from '../components/ui';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Ready-to-ship pieces are typically delivered within 5–7 business days. Custom and made-to-order pieces may take longer depending on complexity — we\'ll share a timeline when you submit your request.',
  },
  {
    q: 'Can I customize a product?',
    a: 'Yes! Many of our products support customization — colour, size, and personalization options are available on the product page, or you can submit a full custom request on our Custom Orders page.',
  },
  {
    q: 'How do I care for my crochet products?',
    a: 'Spot clean gently with a damp cloth and mild soap if needed. Avoid soaking, direct heat, and prolonged sunlight. Reshape your piece gently after handling to keep its form.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'Orders can be cancelled before they enter the "Processing" stage. Once handmade production has started, cancellations may not be possible — please reach out to us as soon as possible.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once signed in, visit My Account → My Orders to see live status updates for every order, from Pending through to Delivered.',
  },
  {
    q: 'What payment methods are available?',
    a: 'We support UPI, major credit and debit cards via Razorpay secure payment.',
  },
  {
    q: 'Do you accept custom orders?',
    a: 'Absolutely — custom orders are one of our favourite things to make. Visit the Custom Orders page to share your idea with us.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="section">
      <div className="container-nest max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <Eyebrow>
            <span className="mx-auto">Good to know</span>
          </Eyebrow>
          <h1 className="font-display text-4xl sm:text-5xl mt-4">Frequently Asked Questions</h1>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <div key={item.q} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left"
                aria-expanded={open === i}
              >
                <span className="font-medium text-[0.95rem]">{item.q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-rose-500 shrink-0">
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 sm:px-6 pb-5 text-sm text-muted leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
