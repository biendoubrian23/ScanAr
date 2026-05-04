'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ImagePlus,
  Cpu,
  QrCode,
  Smartphone,
  Zap,
  Globe,
  BarChart2,
  Code2,
  Sparkles,
  ArrowRight,
  Play,
  Check,
  ScanLine,
  ChevronRight,
  Box,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

// ─── Animation Helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: 'easeOut' } },
});

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div
        className={cn(
          'mx-auto max-w-6xl mt-4 mx-4 lg:mx-auto px-5 py-3',
          'flex items-center justify-between',
          'bg-dark-950/80 backdrop-blur-xl',
          'border border-white/10 rounded-2xl',
          'shadow-xl shadow-black/20',
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-600/30 group-hover:shadow-brand-500/40 transition-shadow">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">ScanAR</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {['Features', 'How it works', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-150"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl',
              'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
              'shadow-md shadow-brand-600/30',
              'hover:shadow-brand-500/40 hover:from-brand-500 hover:to-brand-400',
              'transition-all duration-200',
            )}
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/8 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <div className="w-4 h-3.5 flex flex-col justify-between">
            <span className={cn('block h-0.5 bg-current transition-all', menuOpen && 'rotate-45 translate-y-[6px]')} />
            <span className={cn('block h-0.5 bg-current transition-all', menuOpen && 'opacity-0')} />
            <span className={cn('block h-0.5 bg-current transition-all', menuOpen && '-rotate-45 -translate-y-[6px]')} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mx-4 mt-2 p-4 bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex flex-col gap-3">
          {['Features', 'How it works', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-zinc-300 hover:text-white py-1.5"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="pt-2 border-t border-white/8 flex flex-col gap-2">
            <Link href="/login" className="text-sm text-zinc-400 py-1.5">Login</Link>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white"
            >
              Get Started <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Floating Card (Hero) ─────────────────────────────────────────────────────

function FloatingModelCard() {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      className={cn(
        'relative w-72 h-72 lg:w-80 lg:h-80',
        'glass rounded-3xl overflow-hidden',
        'shadow-2xl shadow-brand-600/20',
      )}
    >
      {/* Shimmer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-brand-400/10" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">preview.glb</span>
      </div>

      {/* 3D placeholder with shimmer */}
      <div className="absolute inset-0 flex items-center justify-center mt-8">
        <div className="relative w-40 h-40">
          {/* Rotating glow ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-brand-500/30 border-dashed"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
            className="absolute inset-4 rounded-full border border-brand-400/20 border-dashed"
          />

          {/* Central box icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-brand-500/40 rounded-full scale-150" />
              <Box className="w-14 h-14 text-brand-400 relative" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s linear infinite',
        }}
      />

      {/* Status bar bottom */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-white/5 border-t border-white/8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-zinc-400">Model ready</span>
          </div>
          <span className="text-[10px] font-medium text-brand-400">View in AR →</span>
        </div>
      </div>

      {/* Particles */}
      <div className="particle particle-1" style={{ bottom: '30%', left: '15%' }} />
      <div className="particle particle-2" style={{ bottom: '25%', right: '20%' }} />
      <div className="particle particle-3" style={{ bottom: '20%', left: '45%' }} />
    </motion.div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ onDemoClick }: { onDemoClick: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger(0)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Hunyuan3D AI
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={stagger(0.1)}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-zinc-100 mb-4"
            >
              Turn any image into{' '}
              <span className="gradient-text block mt-1">AR reality</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial="hidden"
              animate="visible"
              variants={stagger(0.2)}
              className="text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
            >
              Upload a photo. Our AI generates a photorealistic 3D model in seconds.
              Share via QR code. Your customers scan and see it in their space.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger(0.3)}
              className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
            >
              <Link
                href="/signup"
                className={cn(
                  'flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold',
                  'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
                  'shadow-lg shadow-brand-600/35',
                  'hover:shadow-brand-500/45 hover:from-brand-500 hover:to-brand-400',
                  'transition-all duration-200 group',
                )}
              >
                Start for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                onClick={onDemoClick}
                className={cn(
                  'flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-medium',
                  'bg-white/5 backdrop-blur border border-white/10',
                  'text-zinc-200 hover:bg-white/10 hover:border-white/20 hover:text-white',
                  'transition-all duration-200 group',
                )}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600/25 border border-brand-500/30 group-hover:bg-brand-600/35 transition-colors">
                  <Play className="w-3 h-3 text-brand-400 ml-0.5" />
                </div>
                Watch demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger(0.4)}
              className="flex items-center gap-6 mt-8 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Check className="w-3.5 h-3.5 text-green-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Check className="w-3.5 h-3.5 text-green-400" />
                3 free models
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Check className="w-3.5 h-3.5 text-green-400" />
                iOS & Android AR
              </div>
            </motion.div>
          </div>

          {/* Floating card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="shrink-0"
          >
            <FloatingModelCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Pipeline Section ─────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    step: 1,
    icon: ImagePlus,
    title: 'Upload your image',
    description: 'Drag and drop any JPG, PNG, or WebP. Our system accepts high-res photos for the best 3D output.',
  },
  {
    step: 2,
    icon: Cpu,
    title: 'AI generates 3D model',
    description: 'Powered by Hunyuan3D, our pipeline creates a textured mesh with photorealistic materials in seconds.',
  },
  {
    step: 3,
    icon: QrCode,
    title: 'Share via QR code or link',
    description: 'Every model gets a unique AR link and scannable QR code. Share on packaging, ads, or social.',
  },
  {
    step: 4,
    icon: Smartphone,
    title: 'View in AR on any device',
    description: 'Customers tap or scan and see the model in their real space — no app download required.',
  },
];

function PipelineSection() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            How it works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 leading-tight">
            From photo to AR in{' '}
            <span className="gradient-text">four steps</span>
          </h2>
          <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
            No 3D skills needed. Our fully automated pipeline handles everything.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector lines — desktop only */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px">
            <div className="w-full connector-line" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {PIPELINE_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={stagger(i * 0.1)}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon circle */}
                  <div className="relative mb-5">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-brand-600/20 blur-xl scale-150" />
                    <div
                      className={cn(
                        'relative flex items-center justify-center w-20 h-20 rounded-full',
                        'bg-gradient-to-br from-brand-600/30 to-brand-500/20',
                        'border border-brand-500/40',
                        'shadow-lg shadow-brand-600/20',
                      )}
                    >
                      <Icon className="w-8 h-8 text-brand-300" strokeWidth={1.5} />
                    </div>
                    {/* Step number badge */}
                    <div
                      className={cn(
                        'absolute -top-1 -right-1',
                        'flex items-center justify-center w-6 h-6 rounded-full',
                        'bg-brand-600 text-white text-[10px] font-bold',
                        'shadow-md shadow-brand-600/40',
                      )}
                    >
                      {s.step}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">{s.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{s.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Grid ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Photorealistic 3D',
    description: 'Hunyuan3D generates textured meshes with physically-based materials that match your original photo.',
    color: 'from-purple-500/20 to-brand-600/20',
    border: 'hover:border-brand-500/30',
  },
  {
    icon: Globe,
    title: 'iOS & Android AR',
    description: 'USDZ for iOS Quick Look, GLB for Android Scene Viewer. Every device supported, no app needed.',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'hover:border-blue-500/30',
  },
  {
    icon: QrCode,
    title: 'QR Code ready',
    description: 'Auto-generated QR code for every model. Print on packaging, display at POS, or embed online.',
    color: 'from-green-500/20 to-teal-500/20',
    border: 'hover:border-green-500/30',
  },
  {
    icon: Zap,
    title: 'Real-time processing',
    description: 'Watch your model build in real time. Live progress bar keeps you informed every step of the way.',
    color: 'from-yellow-500/20 to-orange-500/20',
    border: 'hover:border-yellow-500/30',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    description: 'Track every AR scan by device, region, and time. Understand how customers engage with your products.',
    color: 'from-indigo-500/20 to-brand-500/20',
    border: 'hover:border-indigo-500/30',
  },
  {
    icon: Code2,
    title: 'API access',
    description: 'RESTful API for programmatic model creation. Integrate ScanAR directly into your product or pipeline.',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'hover:border-pink-500/30',
  },
];

function FeaturesGrid() {
  return (
    <section id="features" className="py-24 relative">
      {/* Background subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-600/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-4">
            <Box className="w-3.5 h-3.5" />
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 leading-tight">
            Everything you need to{' '}
            <span className="gradient-text">go spatial</span>
          </h2>
          <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
            From generation to distribution — ScanAR handles the full AR lifecycle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger(i * 0.07)}
                className={cn(
                  'group relative p-6 rounded-2xl',
                  'bg-white/[0.03] backdrop-blur border border-white/8',
                  'transition-all duration-300',
                  feat.border,
                  'hover:bg-white/[0.05] hover:shadow-xl hover:shadow-black/20',
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-xl mb-4',
                    `bg-gradient-to-br ${feat.color}`,
                    'border border-white/10',
                  )}
                >
                  <Icon className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Use Cases Section ────────────────────────────────────────────────────────

type UseCase = 'e-commerce' | 'restaurant' | 'marketing';

const USE_CASES: { id: UseCase; label: string; icon: React.ElementType; headline: string; description: string; mockStats: { label: string; value: string }[] }[] = [
  {
    id: 'e-commerce',
    label: 'E-commerce',
    icon: Box,
    headline: 'Let shoppers see products in their space before buying',
    description:
      'Reduce returns by up to 40%. Customers who use AR are 94% more likely to make a purchase. Add an AR button to any product page in minutes.',
    mockStats: [
      { label: 'Conversion uplift', value: '+94%' },
      { label: 'Return rate drop', value: '-40%' },
      { label: 'Avg. session time', value: '3.2×' },
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: QrCode,
    headline: 'Menu items that come alive on the table',
    description:
      'Print QR codes on menus or table cards. Customers scan to see a 3D preview of any dish before ordering. Increase upsell and delight guests.',
    mockStats: [
      { label: 'Order value uplift', value: '+28%' },
      { label: 'Guest satisfaction', value: '4.9★' },
      { label: 'Setup time', value: '< 10 min' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Share2,
    headline: 'Campaigns that people actually stop for',
    description:
      'Embed AR experiences in print, OOH, social, and email. Every scan is tracked. Build immersive brand moments that are impossible to scroll past.',
    mockStats: [
      { label: 'Engagement vs static', value: '6×' },
      { label: 'Shareability', value: '+210%' },
      { label: 'Brand recall', value: '+65%' },
    ],
  },
];

function UseCasesSection() {
  const [active, setActive] = useState<UseCase>('e-commerce');
  const current = USE_CASES.find((u) => u.id === active)!;
  const Icon = current.icon;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-4">
            <Globe className="w-3.5 h-3.5" />
            Use cases
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 leading-tight">
            Built for every{' '}
            <span className="gradient-text">industry</span>
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {USE_CASES.map((u) => (
            <button
              key={u.id}
              onClick={() => setActive(u.id)}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                active === u.id
                  ? 'bg-brand-600/25 text-brand-300 border border-brand-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-white/10 hover:bg-white/5',
              )}
            >
              {u.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={cn(
            'grid grid-cols-1 lg:grid-cols-2 gap-8',
            'p-8 rounded-3xl',
            'bg-white/[0.03] border border-white/10',
            'backdrop-blur',
          )}
        >
          {/* Left */}
          <div className="flex flex-col justify-center gap-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30">
              <Icon className="w-7 h-7 text-brand-300" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-3 leading-snug">
                {current.headline}
              </h3>
              <p className="text-zinc-500 leading-relaxed">{current.description}</p>
            </div>
            <Link
              href="/signup"
              className={cn(
                'self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium',
                'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
                'shadow-md shadow-brand-600/30 hover:shadow-brand-500/40',
                'hover:from-brand-500 hover:to-brand-400 transition-all duration-200 group',
              )}
            >
              Try it free
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right — mock dashboard card */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Mock top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-zinc-400 font-mono">live dashboard</span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">ScanAR</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {current.mockStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/5 rounded-xl p-3 border border-white/8"
                  >
                    <div className="text-xl font-bold gradient-text mb-0.5">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-tight">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mock bar chart */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                <div className="text-xs text-zinc-500 mb-3">AR scans — last 7 days</div>
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-700 to-brand-400 opacity-80"
                    />
                  ))}
                </div>
              </div>

              {/* Mock model list */}
              <div className="space-y-2">
                {['Chair model', 'Sneaker 3D', 'Lamp preview'].map((name, i) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/6"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600/30 to-brand-400/20 border border-brand-500/20 flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4 text-brand-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-300 truncate">{name}</div>
                      <div className="text-[10px] text-zinc-600">{(i + 1) * 47} scans</div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-300">Live</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className={cn(
            'relative text-center p-12 rounded-3xl overflow-hidden',
            'bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-transparent',
            'border border-brand-500/25',
          )}
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-radial from-brand-600/20 via-transparent to-transparent pointer-events-none" />

          <motion.div variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-4 leading-tight">
              Ready to go <span className="gradient-text">spatial</span>?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
              Join hundreds of brands already using ScanAR to create immersive AR experiences that convert.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Link
                href="/signup"
                className={cn(
                  'flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold',
                  'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
                  'shadow-xl shadow-brand-600/40',
                  'hover:shadow-brand-500/50 hover:from-brand-500 hover:to-brand-400',
                  'transition-all duration-200 group',
                )}
              >
                Start for free — no card needed
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <p className="mt-6 text-sm text-zinc-600">3 free models · No credit card · Cancel anytime</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();

  const links = {
    Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
    Developers: ['API Docs', 'SDK', 'Webhooks', 'Status'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Cookies'],
  };

  return (
    <footer className="border-t border-white/6 bg-dark-950/80">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 shadow-md shadow-brand-600/25">
                <ScanLine className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold gradient-text">ScanAR</span>
            </Link>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-[160px]">
              Turn any image into a photorealistic AR experience.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {group}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/6">
          <p className="text-xs text-zinc-700">
            &copy; {year} ScanAR. All rights reserved.
          </p>
          <p className="text-xs text-zinc-700">
            Built with{' '}
            <span className="text-brand-600">Hunyuan3D</span>
            {' '}·{' '}
            <span className="text-brand-600">Next.js</span>
            {' '}·{' '}
            <span className="text-brand-600">Supabase</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Demo Modal ───────────────────────────────────────────────────────────────

function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product demo" size="lg">
      <div className="space-y-4">
        {/* Placeholder video frame */}
        <div
          className={cn(
            'flex items-center justify-center w-full aspect-video rounded-xl',
            'bg-gradient-to-br from-brand-600/15 to-brand-400/10',
            'border border-brand-500/20',
          )}
        >
          <div className="text-center space-y-3">
            <div
              className={cn(
                'flex items-center justify-center w-16 h-16 rounded-full mx-auto',
                'bg-brand-600/25 border border-brand-500/40',
                'hover:bg-brand-600/40 transition-colors cursor-pointer',
              )}
            >
              <Play className="w-7 h-7 text-brand-300 ml-1" />
            </div>
            <p className="text-sm text-zinc-500">Demo video coming soon</p>
          </div>
        </div>

        {/* Steps recap */}
        <div className="grid grid-cols-2 gap-3">
          {PIPELINE_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/25 shrink-0">
                  <Icon className="w-4 h-4 text-brand-300" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-300">{s.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <p className="text-sm text-zinc-500">Ready to try it yourself?</p>
          <Link
            href="/signup"
            onClick={onClose}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium',
              'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
              'shadow-md shadow-brand-600/30 hover:shadow-brand-500/40',
              'hover:from-brand-500 hover:to-brand-400 transition-all duration-200',
            )}
          >
            Start free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection onDemoClick={() => setDemoOpen(true)} />
        <PipelineSection />
        <FeaturesGrid />
        <UseCasesSection />
        <CTASection />
      </main>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
