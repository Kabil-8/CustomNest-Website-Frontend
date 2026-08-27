import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, CheckCircle2, MessageCircle, Sparkles, Send } from 'lucide-react';
import { InstagramIcon } from '../components/SocialIcons';
import { useToast } from '../context/ToastContext';
import { Spinner, Eyebrow } from '../components/ui';

// ReactBits Components
import { ThreadParticles } from '../components/reactbits/ThreadParticles';
import { BlurText } from '../components/reactbits/BlurText';
import { MagneticButton } from '../components/reactbits/MagneticButton';

export default function Contact() {
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      show('Please fill in all required fields.', 'error');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSent(true);
    show('Your message has been sent successfully!', 'success');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rose-50/40 via-cream to-cream overflow-x-hidden pt-10 pb-20">
      <ThreadParticles className="opacity-50 pointer-events-none" />

      <div className="container-nest max-w-full px-4 sm:px-8 relative z-10">
        <div className="text-center max-w-lg mx-auto mb-10 sm:mb-14">
          <span className="eyebrow bg-white/90 border border-rose-200 px-3.5 py-1 rounded-full shadow-soft backdrop-blur-sm mb-3 inline-flex items-center gap-1.5 text-xs font-bold">
            <Sparkles size={13} className="text-rose-500 animate-pulse" />
            We're Here For You
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal mt-2 mb-3">Get in Touch</h1>
          <div className="text-muted text-sm sm:text-base leading-relaxed">
            <BlurText text="Questions about a piece, custom order ideas, or bulk gifts? Send us a message and we'll reply promptly." delay={0.1} />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <ContactInfo icon={Mail} label="Email Us" value="ashwithaksamy@gmail.com" href="mailto:ashwithaksamy@gmail.com" />
            <ContactInfo icon={InstagramIcon} label="Instagram DM" value="@thecustomnest" href="https://instagram.com" />
            <ContactInfo icon={Phone} label="Customer Support" value="+91 98765 43210" href="tel:+919876543210" />
            <ContactInfo icon={MapPin} label="Handmade Studio" value="Chennai, Tamil Nadu, India" />

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/80 shadow-soft mt-2">
              <h3 className="font-display text-lg text-charcoal mb-2 flex items-center gap-2">
                <MessageCircle size={18} className="text-rose-500" /> Have a quick question?
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-4">
                Check our Frequently Asked Questions for quick answers on shipping, materials, and care guides.
              </p>
              <Link to="/faq" className="btn-secondary w-full text-xs py-2.5">
                View FAQ & Help Guide →
              </Link>
            </div>
          </div>

          {/* Form Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 border border-rose-100/80 shadow-lift"
          >
            {sent ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-card">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl text-charcoal mb-2">Message Sent Successfully!</h2>
                <p className="text-muted text-sm max-w-sm mx-auto mb-6">
                  Thank you for reaching out, <span className="font-bold text-charcoal">{form.name}</span>. We'll reply to <span className="font-semibold text-rose-600">{form.email}</span> as soon as possible.
                </p>
                <button onClick={() => setSent(false)} className="btn-primary">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
                <div>
                  <h2 className="font-display text-2xl text-charcoal mb-1">Send Us a Message</h2>
                  <p className="text-xs text-muted">Fill out the form below and our team will get back to you.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="c-name">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="c-name"
                      required
                      className="input text-sm rounded-xl"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Priya Nair"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="c-email">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      required
                      className="input text-sm rounded-xl"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="priya@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="c-subject">
                    Subject
                  </label>
                  <input
                    id="c-subject"
                    className="input text-sm rounded-xl"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Question about Bouquet Delivery"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="c-message">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="c-message"
                    required
                    className="input text-sm rounded-xl min-h-[140px] resize-y p-4"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your message here..."
                  />
                </div>

                <MagneticButton strength={0.15} className="w-full mt-1">
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base shadow-lift">
                    {loading ? <Spinner size={18} /> : <Send size={16} />}
                    Send Message
                  </button>
                </MagneticButton>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ContactInfo({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-line/80 shadow-soft hover:shadow-card hover:border-rose-300 transition-all duration-200">
      <div className="w-11 h-11 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="text-sm font-bold text-charcoal">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block hover:opacity-90 transition-opacity">
      {content}
    </a>
  ) : (
    content
  );
}
