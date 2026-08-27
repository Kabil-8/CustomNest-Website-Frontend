import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { useToast } from '../../context/ToastContext';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { show } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      show('Welcome to the Nest! Subscription confirmed. 🧶', 'success');
      setEmail('');
    }
  };

  return (
    <section className="container-nest py-12">
      <AnimatedContent>
        <div className="bg-cream border border-line rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-soft space-y-4">
          <span className="eyebrow mb-1">COMMUNITY</span>
          <h2 className="font-display text-2xl sm:text-3xl text-charcoal">Stay in the Nest</h2>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            New creations, custom ideas, and little handmade moments — delivered occasionally to your inbox.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-full text-xs font-bold mt-2">
              <CheckCircle2 size={16} />
              <span>You're subscribed! Thank you for joining our nest.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="input py-3 text-xs bg-white flex-1"
              />
              <button type="submit" className="btn-primary py-3 px-6 text-xs shrink-0 w-full sm:w-auto">
                <span>Join Us</span>
                <Send size={13} />
              </button>
            </form>
          )}
        </div>
      </AnimatedContent>
    </section>
  );
}
