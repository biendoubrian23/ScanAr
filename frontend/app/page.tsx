'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Camera,
  Hexagon,
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
    <nav className="sticky top-0 inset-x-0 z-50 bg-white border-b border-gray-200">
      <div
        className={cn(
          'mx-auto max-w-7xl px-6 py-4',
          'flex items-center justify-between',
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-md shadow-brand-600/25 group-hover:shadow-brand-500/35 transition-shadow">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ScanAR</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          {['Features', 'How it works', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl',
              'bg-brand-700 text-white',
              'shadow-md shadow-brand-700/20',
              'hover:bg-brand-800 hover:shadow-brand-700/30',
              'transition-all duration-200',
            )}
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
        <div className="md:hidden px-6 py-4 bg-white border-t border-gray-200 flex flex-col gap-3">
          {['Features', 'How it works', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 py-1.5"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
            <Link href="/login" className="text-sm text-gray-600 py-1.5">Login</Link>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition-colors"
            >
              Get Started <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Carousel ────────────────────────────────────────────────────────────

const HERO_IMAGES = [
  { src: '/images/herosection/chaise.png', alt: 'Reconstruction 3D d\'une chaise' },
  { src: '/images/herosection/dessert.png', alt: 'Reconstruction 3D d\'un dessert' },
  { src: '/images/herosection/plat.png', alt: 'Reconstruction 3D d\'un plat' },
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-full">
      {HERO_IMAGES.map((img, i) => (
        <motion.div
          key={img.src}
          initial={false}
          animate={{ opacity: index === i ? 1 : 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
          aria-hidden={index !== i}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="object-contain object-[58%_center]"
          />
        </motion.div>
      ))}

      {/* Pagination dots — absolute bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Afficher l'image ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === i ? 'w-8 bg-gray-900' : 'w-1.5 bg-gray-300 hover:bg-gray-400',
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

const HERO_FEATURES = [
  { icon: Camera, lines: ['Photoréaliste', 'Rendu fidèle'] },
  { icon: Globe, lines: ['WebAR', 'Aucune app requise'] },
  { icon: Share2, lines: ['Partage simple', 'QR code ou lien'] },
];

function HeroSection({ onDemoClick }: { onDemoClick: () => void }) {
  return (
    <section className="relative min-h-[92vh] flex items-start pt-8 lg:pt-[1.8vw] pb-16 lg:pb-[2.7vw] overflow-hidden bg-white">
      {/* Background image carousel — full section, white space in image aligns with text */}
      <motion.div
        initial={{ opacity: 0, y: '-14%' }}
        animate={{ opacity: 1, y: '-14%' }}
        transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
        className="absolute inset-x-0 top-[2vw] bottom-0 pointer-events-none scale-[0.90] origin-center"
      >
        <HeroCarousel />
      </motion.div>

      {/* Foreground content — left text */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-[1.8vw] w-full">
        <div className="max-w-xl lg:max-w-[36vw]">
          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0)}
            className="inline-flex items-center gap-2 lg:gap-[0.45vw] px-3 lg:px-[0.8vw] py-1.5 lg:py-[0.35vw] rounded-full bg-white/80 backdrop-blur border border-gray-200 text-gray-700 text-[10px] lg:text-[0.63vw] font-medium mb-8 lg:mb-[1.6vw] uppercase tracking-[0.08em]"
          >
            <Hexagon className="w-3 h-3 lg:w-[0.75vw] lg:h-[0.75vw]" strokeWidth={1.75} />
            Plateforme de reconstruction 3D & AR
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={stagger(0.1)}
            className="text-[2.1rem] lg:text-[2.3vw] font-bold leading-[1.08] tracking-tight text-gray-900 mb-6 lg:mb-[1.25vw] whitespace-nowrap"
            style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' }}
          >
            Transformez vos visiteurs<br />
            en acheteurs grâce à la<br />
            réalité augmentée :<br />
            +30% de ventes.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={stagger(0.2)}
            className="text-sm lg:text-[0.85vw] text-gray-500 leading-relaxed mb-8 lg:mb-[1.6vw]"
          >
            Offrez à vos clients une expérience d&apos;achat immersive<br />
            depuis leur navigateur, sans aucune application.<br />
            Réduisez les retours, doublez l&apos;engagement<br />
            et concluez plus de ventes.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0.3)}
            className="flex flex-wrap items-center gap-2.5 lg:gap-[0.55vw] mb-12 lg:mb-[2.25vw]"
          >
            <Link
              href="/signup"
              className={cn(
                'flex items-center gap-2 lg:gap-[0.45vw] px-5 lg:px-[1.25vw] py-3 lg:py-[0.75vw] rounded-xl text-sm lg:text-[0.85vw] font-semibold',
                'bg-brand-700 text-white',
                'shadow-md shadow-brand-700/20',
                'hover:bg-brand-800 hover:shadow-brand-700/30',
                'transition-all duration-200 group',
              )}
            >
              Générer un modèle 3D
              <ArrowRight className="w-3.5 h-3.5 lg:w-[0.9vw] lg:h-[0.9vw] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={onDemoClick}
              className={cn(
                'flex items-center gap-2 lg:gap-[0.45vw] px-5 lg:px-[1.25vw] py-3 lg:py-[0.75vw] rounded-xl text-sm lg:text-[0.85vw] font-medium',
                'bg-white/90 backdrop-blur border border-gray-200 text-gray-900',
                'hover:border-gray-300 hover:bg-white',
                'transition-all duration-200',
              )}
            >
              <Play className="w-3 h-3 lg:w-[0.75vw] lg:h-[0.75vw] ml-0.5" fill="currentColor" />
              Voir la démo AR
            </button>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0.4)}
            className="flex items-center gap-3 lg:gap-[0.8vw]"
          >
            {HERO_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.lines.join('-')}
                  className="flex items-center gap-2 lg:gap-[0.55vw] px-3 lg:px-[0.8vw] py-2 lg:py-[0.5vw] rounded-lg bg-white/90 backdrop-blur border border-gray-200"
                >
                  <Icon className="w-4 h-4 lg:w-[1.05vw] lg:h-[1.05vw] text-gray-700 shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] lg:text-[0.65vw] font-semibold text-gray-900 whitespace-nowrap">
                      {feat.lines[0]}
                    </span>
                    <span className="text-[11px] lg:text-[0.65vw] text-gray-500 whitespace-nowrap">
                      {feat.lines[1]}
                    </span>
                  </div>
                </div>
              );
            })}
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
