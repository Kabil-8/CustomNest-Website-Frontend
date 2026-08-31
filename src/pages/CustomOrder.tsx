import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareHeart,
  Palette,
  Sparkles,
  PackageCheck,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Heart,
  Check,
  ChevronRight,
  Lock,
  LogIn,
  Loader2,
  Layers,
  Ruler,
  AlertCircle,
} from 'lucide-react';
import { customOrders as customOrderApi } from '../lib/api';
import { listActiveColors, type ApiColor } from '../lib/productApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eyebrow, Spinner, StitchDivider } from '../components/ui';
import { MagneticButton } from '../components/reactbits/MagneticButton';
import { ThreadParticles } from '../components/reactbits/ThreadParticles';

const STEPS = [
  {
    num: '01',
    icon: MessageSquareHeart,
    title: 'Share Your Idea',
    desc: 'Tell us the occasion, character, or vision you want crafted.',
  },
  {
    num: '02',
    icon: Palette,
    title: 'Customize Details',
    desc: 'Pick your colors, dimensions, and reference photos.',
  },
  {
    num: '03',
    icon: Sparkles,
    title: 'Handcrafted Stitching',
    desc: 'We lovingly weave your piece, stitch by stitch.',
  },
  {
    num: '04',
    icon: PackageCheck,
    title: 'Delivered With Care',
    desc: 'Safely packed in our signature gift box & shipped to you.',
  },
];

const CATEGORY_PRESETS = [
  { id: 'special-combo', name: 'Special Combo Bouquet', image: '/images/categories/special-combo-bouquets.jpg' },
  { id: 'jumbo-flower', name: 'Jumbo Flower Bouquet', image: '/images/categories/jumbo-flower-bouquets.jpg' },
  { id: 'plushies', name: 'Plushies & Amigurumi', image: '/images/categories/plushies.jpg' },
  { id: 'resin-frames', name: 'Resin Memory Frame', image: '/images/categories/resin-frames.jpg' },
  { id: 'event-specific', name: 'Event & Occasion Gift', image: '/images/categories/event-specific.jpg' },
  { id: 'single-flowers', name: 'Single Crochet Flowers', image: '/images/categories/single-flowers.jpg' },
];

const SIZE_OPTIONS = [
  { label: 'Small',  desc: 'Compact & cute' },
  { label: 'Medium', desc: 'Most popular size' },
  { label: 'Large',  desc: 'Statement piece' },
  { label: 'Custom', desc: 'Specify in description' },
];

const YARN_OPTIONS = [
  { value: 'normal',  label: 'Normal Yarn',  desc: 'Soft milk cotton — matte, gentle finish' },
  { value: 'acrylic', label: 'Acrylic Yarn', desc: 'Vibrant & durable — great for bold colors' },
  { value: 'either',  label: 'No Preference', desc: 'Let us pick the best for your piece' },
];

export default function CustomOrder() {
  const { show } = useToast();
  const { user, isLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  // ── Live color palette from DB ────────────────────────────────────────────
  const [colorPalette, setColorPalette] = useState<ApiColor[]>([]);
  const [colorsLoading, setColorsLoading] = useState(true);

  useEffect(() => {
    listActiveColors()
      .then(setColorPalette)
      .catch(() => {/* silently fall back to no colors */})
      .finally(() => setColorsLoading(false));
  }, []);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    productType: 'Special Combo Bouquet',
    colors: '',        // color name selected from DB palette
    yarnType: 'either' as 'normal' | 'acrylic' | 'either' | '',
    size: 'Medium',
    quantity: 1,
    budget: 'Rs.1,000 - Rs.2,000',
    deadline: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill user profile info if available
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        show('Please select an image smaller than 5MB.', 'error');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFilePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFilePreview(null);
    setFileName('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalName = (form.name || user.name || '').trim();
    const finalPhone = (form.phone || user.phone || '').trim();
    const finalDesc = form.description.trim();

    const newErrors: Record<string, string> = {};

    if (!finalName) {
      newErrors.name = 'Full name is required';
    } else if (finalName.length < 2) {
      newErrors.name = 'Please enter at least 2 characters for your name';
    }

    if (!finalPhone) {
      newErrors.phone = 'Phone / WhatsApp number is required';
    } else if (finalPhone.replace(/\D/g, '').length < 6) {
      newErrors.phone = 'Please enter a valid phone number (at least 6 digits)';
    }

    if (!finalDesc) {
      newErrors.description = 'Please describe your custom order vision';
    } else if (finalDesc.length < 10) {
      newErrors.description = 'Please provide a little more detail (at least 10 characters)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const missingFields: string[] = [];
      if (newErrors.name) missingFields.push('Full Name');
      if (newErrors.phone) missingFields.push('Phone Number');
      if (newErrors.description) missingFields.push('Description');

      show(`Please fill in the required fields highlighted in red: ${missingFields.join(', ')}`, 'error');

      // Scroll and focus on the first invalid field
      const firstKey = Object.keys(newErrors)[0];
      const targetId = firstKey === 'description' ? 'co-desc' : `co-${firstKey}`;
      const el = document.getElementById(targetId);
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await customOrderApi.submit({
        ...form,
        email: user.email,
        name: finalName,
        phone: finalPhone,
        description: finalDesc,
        referenceImage: filePreview || undefined,
      });
      setSubmitted(true);
      show('Your custom request has been submitted!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={28} />
      </div>
    );
  }

  // ── Login wall ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-rose-50/40 via-cream to-cream">
        <ThreadParticles className="opacity-60" />
        <section className="relative pt-12 pb-12 sm:pt-16 sm:pb-16 overflow-hidden z-10">
          <div className="container-nest text-center max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="eyebrow bg-white/90 border border-rose-200 px-3.5 py-1.5 rounded-full shadow-soft backdrop-blur-sm mb-4 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider">
                <Sparkles size={13} className="text-rose-500 animate-pulse" />
                Bespoke Craftsmanship • Made to Order
              </span>
              <h1 className="font-display text-4xl sm:text-5xl text-charcoal leading-tight mt-2 mb-4">
                Bring Your Vision to Life
              </h1>
              <StitchDivider className="mx-auto mt-4 mb-8 opacity-70" width={160} />
            </motion.div>
          </div>
        </section>

        <section className="pb-24 relative z-10">
          <div className="container-nest max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 border border-rose-100/80 shadow-lift text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Lock size={28} />
              </div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Sign In to Place a Custom Order</h2>
              <p className="text-muted text-sm leading-relaxed mb-8">
                Custom orders are linked to your account so you can track their status, receive quotes, and get updates from our artisan team -- all in one place.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/login?redirect=/custom-order" className="btn-primary w-full flex items-center justify-center gap-2">
                  <LogIn size={17} /> Sign In to Continue
                </Link>
                <Link to="/register?redirect=/custom-order" className="btn-secondary w-full">
                  Create an Account
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rose-50/40 via-cream to-cream">
      {/* Thread wave canvas background */}
      <ThreadParticles className="opacity-60" />

      {/* Hero Header */}
      <section className="relative pt-12 pb-12 sm:pt-16 sm:pb-16 overflow-hidden z-10">
        <div className="container-nest text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="eyebrow bg-white/90 border border-rose-200 px-3.5 py-1.5 rounded-full shadow-soft backdrop-blur-sm mb-4 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider">
              <Sparkles size={13} className="text-rose-500 animate-pulse" />
              Bespoke Craftsmanship • Made to Order
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-charcoal leading-[1.08] mt-2 mb-4">
              Bring Your Vision to Life
            </h1>
            <p className="text-muted text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              From custom color palettes and personalized character plushies to memory resin frames and special event bouquets -- tell us your idea and we'll handcraft it stitch by stitch.
            </p>
            <StitchDivider className="mx-auto mt-6 opacity-70" width={160} />
          </motion.div>
        </div>
      </section>

      {/* 4 Interactive Process Step Cards */}
      <section className="pb-14 relative z-10">
        <div className="container-nest">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="group relative bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-line/80 shadow-soft hover:shadow-lift hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <s.icon size={22} />
                    </div>
                    <span className="font-display text-2xl font-bold text-rose-300 group-hover:text-rose-500 transition-colors">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-charcoal mb-2">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/50 flex items-center text-xs font-semibold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Step {i + 1} of 4</span>
                  <ChevronRight size={14} className="ml-auto" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Form Section */}
      <section className="pb-24 relative z-10">
        <div className="container-nest max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-12 border border-rose-100/80 shadow-lift">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 px-4"
                >
                  <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-card">
                    <CheckCircle2 size={42} />
                  </div>
                  <span className="eyebrow bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-rose-700 text-xs font-bold mb-3 inline-block">
                    Request Confirmed
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl text-charcoal mb-3">Custom Request Received!</h2>
                  <p className="text-muted text-base max-w-md mx-auto leading-relaxed mb-8">
                    Thank you, <span className="font-bold text-charcoal">{form.name || user.name}</span>! Our artisan team will review your custom request for <span className="font-semibold text-rose-600">{form.productType}</span> and reach out to <span className="font-bold text-charcoal">{user.email}</span> with a custom quote and timeline within 24 hours.
                  </p>

                  <div className="bg-ivory rounded-2xl p-6 max-w-md mx-auto border border-line text-left mb-8 space-y-2 text-sm text-charcoal">
                    <div className="flex justify-between">
                      <span className="text-muted">Item Type:</span>
                      <span className="font-semibold">{form.productType}</span>
                    </div>
                    {form.colors && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Color:</span>
                        <span className="font-semibold flex items-center gap-2">
                          {colorPalette.find(c => c.name === form.colors) && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white shadow-sm inline-block"
                              style={{ backgroundColor: colorPalette.find(c => c.name === form.colors)?.hexCode }}
                            />
                          )}
                          {form.colors}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Size:</span>
                      <span className="font-semibold">{form.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Yarn Type:</span>
                      <span className="font-semibold capitalize">
                        {form.yarnType === 'either' ? 'No preference' : form.yarnType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Budget Tier:</span>
                      <span className="font-semibold">{form.budget}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFilePreview(null);
                      setFileName('');
                    }}
                    className="btn-primary"
                  >
                    Submit Another Custom Order
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={onSubmit}
                  className="space-y-8"
                  noValidate
                >
                  <div>
                    <span className="eyebrow text-xs">Custom order form</span>
                    <h2 className="font-display text-3xl sm:text-4xl text-charcoal mt-1">Design Your Custom Piece</h2>
                    <p className="text-muted text-sm mt-1">Select options below or describe your idea in detail.</p>
                  </div>

                  {/* 1. Category Selector Cards */}
                  <div>
                    <label className="label mb-3">1. Select Product Category <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CATEGORY_PRESETS.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => update({ productType: cat.name })}
                          className={`relative rounded-xl overflow-hidden border-2 p-2 flex items-center gap-3 text-left transition-all duration-200 ${
                            form.productType === cat.name
                              ? 'border-rose-500 bg-rose-50/70 shadow-sm'
                              : 'border-line/70 bg-ivory/50 hover:bg-white hover:border-rose-200'
                          }`}
                        >
                          <img src={cat.image} alt={cat.name} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                          <span className="text-xs font-semibold text-charcoal leading-tight">{cat.name}</span>
                          {form.productType === cat.name && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                              <Check size={10} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Color Palette Selector — live from DB */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette size={15} className="text-rose-500" />
                      <label className="label mb-0">2. Preferred Color</label>
                      {form.colors && (
                        <button
                          type="button"
                          onClick={() => update({ colors: '' })}
                          className="ml-auto text-[0.65rem] text-muted hover:text-rose-600 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {colorsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted py-3">
                        <Loader2 size={14} className="animate-spin text-rose-400" />
                        Loading color palette…
                      </div>
                    ) : colorPalette.length === 0 ? (
                      <p className="text-xs text-muted py-2 italic">
                        No colors configured yet — just describe your preferred colors in the description below.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {colorPalette.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => update({ colors: form.colors === c.name ? '' : c.name })}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                              form.colors === c.name
                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                                : 'border-line bg-white text-muted hover:text-charcoal hover:border-rose-200'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                              style={{ backgroundColor: c.hexCode }}
                            />
                            {c.name}
                            {form.colors === c.name && <Check size={11} className="text-rose-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Yarn Type Selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={15} className="text-rose-500" />
                      <label className="label mb-0">3. Yarn Type Preference</label>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {YARN_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update({ yarnType: opt.value as typeof form.yarnType })}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            form.yarnType === opt.value
                              ? 'border-rose-500 bg-rose-50/70 shadow-sm'
                              : 'border-line/70 bg-ivory/50 hover:bg-white hover:border-rose-200'
                          }`}
                        >
                          <p className="text-xs font-bold text-charcoal">{opt.label}</p>
                          <p className="text-[0.65rem] text-muted mt-0.5 leading-relaxed">{opt.desc}</p>
                          {form.yarnType === opt.value && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                              <Check size={10} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Size Selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Ruler size={15} className="text-rose-500" />
                      <label className="label mb-0">4. Size</label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {SIZE_OPTIONS.map((sz) => (
                        <button
                          key={sz.label}
                          type="button"
                          onClick={() => update({ size: sz.label })}
                          className={`px-4 py-2.5 rounded-xl border-2 text-left transition-all ${
                            form.size === sz.label
                              ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                              : 'border-line bg-white text-charcoal hover:border-rose-200'
                          }`}
                        >
                          <p className="text-xs font-bold">{sz.label}</p>
                          <p className="text-[0.62rem] text-muted mt-0.5">{sz.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Personal Info & Order Details Grid */}
                  <div className="grid sm:grid-cols-2 gap-5 pt-2">
                    <Field
                      id="co-name"
                      label="Your Full Name"
                      required
                      value={form.name || user.name}
                      onChange={(v) => {
                        update({ name: v });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. Ananya Sharma"
                      error={errors.name}
                    />

                    {/* Email locked to account -- read-only */}
                    <div>
                      <label className="label mb-1.5 flex items-center gap-1.5">
                        Email Address
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <Lock size={10} /> Locked to account
                        </span>
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="input bg-rose-50/40 cursor-not-allowed text-muted border-rose-100 select-none"
                        tabIndex={-1}
                      />
                    </div>

                    <Field
                      id="co-phone"
                      label="Phone / WhatsApp Number"
                      required
                      value={form.phone}
                      onChange={(v) => {
                        update({ phone: v });
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="+91 98765 43210"
                      error={errors.phone}
                    />
                    <Field label="Estimated Budget" value={form.budget} onChange={(v) => update({ budget: v })} placeholder="e.g. Rs.1,000 - Rs.2,000" />
                    <Field label="Quantity Needed" type="number" value={String(form.quantity)} onChange={(v) => update({ quantity: Number(v) || 1 })} />
                    <Field label="Preferred Delivery Date" type="date" value={form.deadline} onChange={(v) => update({ deadline: v })} />
                  </div>

                  {/* 6. Description Text Area */}
                  <div>
                    <label className="label flex items-center justify-between" htmlFor="co-desc">
                      <span>6. Describe Your Custom Vision <span className="text-rose-500">*</span></span>
                    </label>
                    <textarea
                      id="co-desc"
                      required
                      className={`input min-h-[130px] resize-y rounded-2xl p-4 text-sm leading-relaxed transition-all duration-200 ${
                        errors.description
                          ? 'border-red-500 bg-red-50/20 text-charcoal ring-2 ring-red-300/40 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                          : ''
                      }`}
                      value={form.description}
                      onChange={(e) => {
                        update({ description: e.target.value });
                        if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      placeholder="Tell us about the colors, flowers, characters, names, or special details you'd love in your custom order..."
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1 animate-fadeIn">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{errors.description}</span>
                      </p>
                    )}
                  </div>

                  {/* 7. Reference Photo Upload Dropzone */}
                  <div>
                    <label className="label">7. Reference Image (Optional)</label>
                    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                      filePreview ? 'border-rose-400 bg-rose-50/50' : 'border-line hover:border-rose-300 bg-ivory/40'
                    }`}>
                      {filePreview ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4 min-w-0">
                            <img src={filePreview} alt="Reference Preview" className="w-16 h-16 rounded-xl object-cover border border-rose-200 shadow-sm shrink-0" />
                            <div className="text-left min-w-0">
                              <p className="text-xs font-bold text-charcoal truncate">{fileName}</p>
                              <p className="text-[11px] text-rose-600 font-semibold">Image uploaded cleanly • Click to change</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100/60 transition shrink-0 ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-rose-100/80 text-rose-600 flex items-center justify-center mx-auto mb-2">
                            <Upload size={20} />
                          </div>
                          <p className="text-xs font-bold text-charcoal">Click or drag a reference image here</p>
                          <p className="text-[11px] text-muted mt-0.5">JPG, PNG or WEBP up to 5MB</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>

                  {/* Trust guarantees bar */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-ivory/80 rounded-xl border border-line text-[11px] font-semibold text-charcoal">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-rose-500" /> 100% Handcrafted
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-rose-500" /> 24hr Response Time
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart size={14} className="text-rose-500" /> Pan-India Shipping
                    </div>
                  </div>

                  {/* Submit Button */}
                  <MagneticButton strength={0.15} className="w-full">
                    <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base shadow-lift">
                      {loading ? <Spinner size={18} /> : <Sparkles size={18} />}
                      Submit Custom Order Request
                    </button>
                  </MagneticButton>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = 'text',
  className = '',
  placeholder,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  className?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label flex items-center justify-between mb-1.5">
        <span>{label} {required && <span className="text-rose-500">*</span>}</span>
      </label>
      <input
        id={id}
        type={type}
        className={`input rounded-xl text-sm transition-all duration-200 ${
          error
            ? 'border-red-500 bg-red-50/20 text-charcoal ring-2 ring-red-300/40 focus:ring-2 focus:ring-red-400 focus:border-red-500'
            : ''
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && (
        <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1 animate-fadeIn">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
