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
  Link2,
  ScanSearch,
  Instagram,
  Facebook,
  Mail,
  Store,
  Plus,
  Youtube,
  Linkedin,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

// ─── Custom Brand Icons ───────────────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.75a4.84 4.84 0 01-1.02-.06z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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

const HERO_IMAGES_MOBILE = [
  { src: '/images/herosection/chaiseMobile.png', alt: 'Reconstruction 3D d\'une chaise' },
  { src: '/images/herosection/dessertMobile.png', alt: 'Reconstruction 3D d\'un dessert' },
  { src: '/images/herosection/platMobile.png', alt: 'Reconstruction 3D d\'un plat' },
];

function HeroCarousel({ images = HERO_IMAGES, objectPosition = '58% center' }: { images?: typeof HERO_IMAGES; objectPosition?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="relative w-full h-full">
      {images.map((img, i) => (
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
            quality={92}
            className="object-contain"
            style={{ objectPosition }}
          />
        </motion.div>
      ))}

      {/* Pagination dots — absolute bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {images.map((_, i) => (
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
    <section className="relative lg:min-h-[54rem] flex items-start pt-6 pb-10 lg:pb-12 overflow-hidden bg-white">
      {/* Desktop image carousel — absolute, hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, y: '-5%' }}
        animate={{ opacity: 1, y: '-5%' }}
        transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
        className="hidden lg:block absolute inset-x-0 top-[0.6rem] bottom-0 pointer-events-none scale-[0.90] origin-center"
      >
        <HeroCarousel />
      </motion.div>

      {/* Foreground content — stacked on mobile, left column on desktop */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
        <div className="lg:max-w-[33rem]">
          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0)}
            className="hidden lg:inline-flex items-center gap-[0.55rem] px-[0.825rem] py-[0.4125rem] rounded-full bg-white/80 backdrop-blur border border-gray-200 text-gray-700 text-[11px] font-medium mb-8 lg:mb-[3.5rem] uppercase tracking-[0.08em]"
          >
            <Hexagon className="w-[0.825rem] h-[0.825rem]" strokeWidth={1.75} />
            Plateforme de reconstruction 3D & AR
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={stagger(0.1)}
            className="text-[1.5rem] lg:text-[3rem] leading-[1.1] lg:leading-[1.0] text-gray-900 mb-6 lg:mb-[2.4rem] whitespace-nowrap"
            style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400, letterSpacing: '0' }}
          >
            <span
              className="inline-block"
              style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
            >
              {/* Mobile: 2-line marketing title */}
              <span className="lg:hidden">
                Augmentez vos{' '}
                <span className="relative inline-block">
                  ventes
                  <svg
                    aria-hidden
                    className="absolute left-[-3%] right-[-3%] -bottom-1 w-[106%] h-3 pointer-events-none"
                    viewBox="0 0 100 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3,8 C30,3 70,3 97,8"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span> grâce<br />
                à la réalité augmentée.
              </span>

              {/* Desktop: full pyramid title */}
              <span className="hidden lg:inline">
                Transformez vos visiteurs<br />
                en acheteurs grâce à la<br />
                réalité augmentée :<br />
                <span className="relative inline-block">
                  +30%
                  <svg
                    aria-hidden
                    className="absolute left-[-3%] right-[-3%] -bottom-1 w-[106%] h-3 pointer-events-none"
                    viewBox="0 0 100 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3,8 C30,3 70,3 97,8"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span> de ventes.
              </span>
            </span>
          </motion.h1>

          {/* Mobile image carousel — uses mobile-suffixed images, full screen width */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="lg:hidden relative -mx-6 aspect-[5/4] mb-8"
          >
            <HeroCarousel images={HERO_IMAGES_MOBILE} objectPosition="center center" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={stagger(0.2)}
            className="text-[0.95rem] text-gray-500 leading-relaxed mb-7 lg:mb-[2.2rem]"
          >
            {/* Mobile: single paragraph */}
            <span className="lg:hidden">
              Offrez à vos clients une expérience d&apos;achat immersive depuis leur navigateur, sans aucune application. Réduisez les retours, doublez l&apos;engagement et concluez plus de ventes.
            </span>
            {/* Desktop: pyramid lines */}
            <span className="hidden lg:inline">
              Offrez à vos clients une expérience d&apos;achat immersive<br />
              depuis leur navigateur, sans aucune application.<br />
              Réduisez les retours, doublez l&apos;engagement<br />
              et concluez plus de ventes.
            </span>
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0.3)}
            className="flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-center gap-3 lg:gap-[0.69rem] mb-8 lg:mb-[2.75rem]"
          >
            <Link
              href="/signup"
              className={cn(
                'flex items-center justify-center gap-[0.55rem] px-[1.375rem] py-[0.9rem] lg:py-[0.825rem] rounded-xl text-[0.95rem] font-semibold',
                'w-full lg:w-auto',
                'bg-brand-700 text-white',
                'shadow-md shadow-brand-700/20',
                'hover:bg-brand-800 hover:shadow-brand-700/30',
                'transition-all duration-200 group',
              )}
            >
              Générer un modèle 3D
              <ArrowRight className="w-[0.96rem] h-[0.96rem] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={onDemoClick}
              className={cn(
                'flex items-center justify-center gap-[0.55rem] px-[1.375rem] py-[0.9rem] lg:py-[0.825rem] rounded-xl text-[0.95rem] font-medium',
                'w-full lg:w-auto',
                'bg-white/90 backdrop-blur border border-gray-200 text-gray-900',
                'hover:border-gray-300 hover:bg-white',
                'transition-all duration-200',
              )}
            >
              <Play className="w-[0.825rem] h-[0.825rem] ml-0.5" fill="currentColor" />
              Voir la démo AR
            </button>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0.4)}
            className="flex flex-nowrap items-center justify-between lg:justify-start gap-2 lg:gap-[0.825rem] w-full lg:w-auto"
          >
            {HERO_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.lines.join('-')}
                  className="flex items-center gap-1 lg:gap-[0.55rem]"
                >
                  <Icon className="w-3 h-3 lg:w-[1.1rem] lg:h-[1.1rem] text-gray-700 shrink-0" strokeWidth={1.75} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[9px] lg:text-[12px] font-semibold text-gray-900 whitespace-nowrap">
                      {feat.lines[0]}
                    </span>
                    <span className="text-[9px] lg:text-[12px] text-gray-500 whitespace-nowrap">
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

// ─── Immersive Experience Section ─────────────────────────────────────────────

const IMMERSIVE_FEATURES = [
  {
    icon: ScanLine,
    title: 'Manipulation 360° fluide',
    desc: 'Pivot, zoom, inspection libre — comme en boutique.',
  },
  {
    icon: Box,
    title: 'Échelle réelle, contexte réel',
    desc: "Vos clients placent le produit chez eux avant d'acheter.",
  },
  {
    icon: BarChart2,
    title: '+40% d\'engagement, −25% de retours',
    desc: 'Une décision prise en confiance, et un panier qui grimpe.',
  },
];

function ImmersiveSection() {
  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        {/* Centered section title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center text-[2.2rem] lg:text-[2.9rem] leading-[1.0] text-gray-900 mb-16 lg:mb-20"
          style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400, letterSpacing: '0' }}
        >
          <span
            className="inline-block"
            style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom' }}
          >
            L&apos;achat passe à la dimension supérieure.
          </span>
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          {/* Left — Image (square corners, fills column height) */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative ring-1 ring-gray-200 shadow-xl shadow-gray-900/10 overflow-hidden min-h-[360px]"
          >
            <Image
              src="/images/section/section1.png"
              alt="Tablette affichant un produit en réalité augmentée à taille réelle"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              quality={92}
              className="object-cover"
            />
          </motion.div>

          {/* Right — Content (vertically centered to match image height) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="flex flex-col justify-center"
          >
            {/* Subtitle */}
            <h3
              className="text-[1.9rem] lg:text-[2.4rem] leading-[1.05] text-gray-900 mb-6"
              style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400, letterSpacing: '0' }}
            >
              <span
                className="inline-block lg:hidden"
                style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
              >
                Vos produits, entre les<br />
                mains de vos clients.
              </span>
              <span
                className="hidden lg:inline-block"
                style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
              >
                Vos produits,<br />
                entre les mains de vos clients.
              </span>
            </h3>

            {/* Description */}
            <p className="text-[1rem] text-gray-600 leading-relaxed mb-7">
              Manipulez, tournez, placez à taille réelle, depuis n&apos;importe
              quel téléphone, sans installation ni friction. L&apos;expérience
              d&apos;une boutique physique, accessible en un seul clic.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-4 mb-9">
              {IMMERSIVE_FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
                    <Icon className="w-[1rem] h-[1rem]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[0.95rem] font-semibold text-gray-900 leading-snug">{title}</p>
                    <p className="text-[0.875rem] text-gray-500 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[0.95rem] font-semibold',
                  'bg-gray-900 text-white',
                  'hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/15',
                  'transition-all duration-200 group',
                )}
              >
                Démarrer maintenant
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 px-3 py-3 text-[0.95rem] font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Voir le pipeline
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Pipeline Visual Section ──────────────────────────────────────────────────

function PipelineVisualSection() {
  return (
    <section className="relative py-24 bg-[#fafafa] overflow-hidden hidden lg:block">
      <div className="mx-auto max-w-[100rem] px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center text-[2.2rem] lg:text-[2.9rem] leading-[1.0] text-gray-900 mb-14 lg:mb-20"
          style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400, letterSpacing: '0' }}
        >
          <span className="text-stretched-center">
            De la photo à la réalité augmentée.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative"
        >
          <Image
            src="/images/section/section3.png"
            alt="Pipeline ScanAR : capturer, reconstruire, optimiser, générer le QR code, voir en AR"
            width={2172}
            height={724}
            className="w-full h-auto lg:scale-[1.1] origin-center"
            sizes="(min-width: 1024px) 95vw, 100vw"
            quality={92}
          />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Catalogues AR Section (Section 4) ────────────────────────────────────────

const CATALOGUE_FEATURES = [
  { icon: Box, label: 'Vos produits en 3D et en AR' },
  { icon: Smartphone, label: 'Consultation facile depuis un simple lien' },
  { icon: BarChart2, label: 'Boostez l’engagement et vos ventes' },
];

function CataloguesARSection() {
  const titleMobile = (
    <span
      className="inline-block"
      style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
    >
      Des catalogues qui se<br />
      vivent en réalité<br />
      augmentée.
    </span>
  );
  const titleDesktop = (
    <span
      className="inline-block"
      style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
    >
      Des catalogues qui se vivent<br />
      en réalité augmentée.
    </span>
  );

  return (
    <section className="relative py-20 lg:py-28 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Mobile-only title (appears first on mobile) */}
          <h2
            className="lg:hidden order-1 text-[2rem] leading-[1.05] text-gray-900"
            style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400 }}
          >
            {titleMobile}
          </h2>

          {/* Image — second on mobile, right column on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative w-full order-2 lg:order-2"
          >
            <Image
              src="/images/section/section4.png"
              alt="Quatre téléphones présentant des catalogues en réalité augmentée"
              width={1400}
              height={1100}
              sizes="(min-width: 1024px) 55vw, 100vw"
              quality={92}
              className="w-full h-auto object-contain lg:scale-110 origin-center"
              priority={false}
            />
          </motion.div>

          {/* Content — third on mobile, left column on desktop */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="order-3 lg:order-1"
          >
            {/* Desktop-only title */}
            <h2
              className="hidden lg:block text-[2.9rem] leading-[1.05] text-gray-900 mb-6"
              style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400 }}
            >
              {titleDesktop}
            </h2>

            {/* Subtitle */}
            <p className="text-[0.95rem] text-gray-500 leading-relaxed mb-8 max-w-md">
              Transformez vos produits en expériences 3D immersives.
              Offrez à vos clients une nouvelle façon de découvrir,
              d’interagir et d’acheter.
            </p>

            {/* Feature list */}
            <ul className="space-y-4 mb-9">
              {CATALOGUE_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3.5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm shrink-0">
                    <Icon className="w-[1.05rem] h-[1.05rem] text-gray-700" strokeWidth={1.75} />
                  </div>
                  <span className="text-[0.95rem] text-gray-700">{label}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div>
              <Link
                href="/signup"
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[0.95rem] font-semibold',
                  'bg-brand-700 text-white',
                  'shadow-md shadow-brand-700/20',
                  'hover:bg-brand-800 hover:shadow-brand-700/30',
                  'transition-all duration-200 group',
                )}
              >
                Créer mon catalogue AR
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Créez. Partagez. Vendez. Section (Section 5) ─────────────────────────────

const CREATION_STEPS = [
  {
    icon: Box,
    title: '1. Importez ou créez vos produits 3D',
    desc: 'Transformez vos visuels 2D en modèles\n3D optimisés pour la réalité augmentée.',
  },
  {
    icon: Link2,
    title: '2. Générez votre catalogue AR',
    desc: 'Obtenez un lien unique pour accéder à votre\ncatalogue interactif, prêt à être partagé.',
  },
  {
    icon: ScanSearch,
    title: '3. Vos clients vivent l’expérience',
    desc: 'Ils scannent, explorent et visualisent vos\nproduits dans leur environnement.',
  },
];

const DIFFUSION_CHANNELS = [
  { icon: Globe,         label: 'Site web',    iconClass: 'text-sky-500',      bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: Instagram,     label: 'Instagram',   iconClass: 'text-white',        bgClass: 'bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600' },
  { icon: Facebook,      label: 'Facebook',    iconClass: 'text-[#1877F2]',    bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: TikTokIcon,    label: 'TikTok',      iconClass: 'text-black',        bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: WhatsAppIcon,  label: 'WhatsApp',    iconClass: 'text-[#25D366]',    bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: Youtube,       label: 'YouTube',     iconClass: 'text-[#FF0000]',    bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: X,             label: 'X / Twitter', iconClass: 'text-gray-900',     bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: Linkedin,      label: 'LinkedIn',    iconClass: 'text-[#0A66C2]',    bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: Mail,          label: 'Email',       iconClass: 'text-[#EA4335]',    bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
  { icon: Store,         label: 'Boutique',    iconClass: 'text-amber-600',    bgClass: 'bg-gradient-to-br from-white/95 to-white/55' },
];

function CreationFlowSection() {
  return (
    <section className="relative py-20 lg:py-28 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
          {/* Mobile-only title (appears first on mobile) */}
          <h2
            className="lg:hidden order-1 text-[1.95rem] leading-[1.05] text-gray-900 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400 }}
          >
            <span
              className="inline-block"
              style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
            >
              Créez. Partagez. Vendez.
            </span>
          </h2>

          {/* Image — second on mobile, right column on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative w-full order-2 lg:order-2"
          >
            <Image
              src="/images/section/section5.png"
              alt="Trois étapes pour créer, générer et partager un catalogue AR"
              width={1400}
              height={1100}
              sizes="(min-width: 1024px) 60vw, 100vw"
              quality={92}
              className="w-full h-auto object-contain lg:scale-[1.32] origin-center"
            />
          </motion.div>

          {/* Content — third on mobile, left column on desktop */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="order-3 lg:order-1"
          >
            {/* Desktop-only title */}
            <h2
              className="hidden lg:block text-[2.9rem] leading-[1.05] text-gray-900 mb-6"
              style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400 }}
            >
              <span
                className="inline-block"
                style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
              >
                Créez. Partagez.<br />
                Vendez.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-[0.95rem] text-gray-500 leading-relaxed mb-8 max-w-md">
              Créez votre catalogue 3D en quelques minutes<br />
              et laissez vos clients vivre l’expérience en AR.
            </p>

            {/* Steps */}
            <ul className="space-y-5 mb-9">
              {CREATION_STEPS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3.5">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm shrink-0">
                    <Icon className="w-[1.05rem] h-[1.05rem] text-gray-700" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[0.95rem] font-semibold text-gray-900 leading-snug">{title}</p>
                    <p className="text-[0.875rem] text-gray-500 leading-snug mt-0.5 whitespace-pre-line">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div>
              <Link
                href="/signup"
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[0.95rem] font-semibold',
                  'bg-brand-700 text-white',
                  'shadow-md shadow-brand-700/20',
                  'hover:bg-brand-800 hover:shadow-brand-700/30',
                  'transition-all duration-200 group',
                )}
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="mt-3 text-xs text-gray-400">Aucune carte bancaire requise</p>
            </div>
          </motion.div>
        </div>

        {/* Diffusion row — liquid-glass style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h3 className="text-[1.25rem] lg:text-[1.4rem] font-semibold text-gray-900 mb-8">
            Diffusez votre catalogue partout
          </h3>

          <div className="relative overflow-hidden">
            {/* Edge fade masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />

            <div className="flex animate-marquee gap-6 lg:gap-10">
              {[...DIFFUSION_CHANNELS, ...DIFFUSION_CHANNELS].map(({ icon: Icon, label, iconClass, bgClass }, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'flex items-center justify-center w-14 h-14 rounded-2xl backdrop-blur-xl',
                      bgClass,
                      'border border-white/70',
                      'shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]',
                      'ring-1 ring-gray-200/60',
                    )}
                  >
                    <Icon className={cn('w-5 h-5', iconClass)} strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Final CTA Section (Section 6) ────────────────────────────────────────────

function FinalCtaSection() {
  return (
    <section className="relative bg-white pt-32 sm:pt-44 lg:pt-56 pb-12 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={cn(
            'relative rounded-[2rem] lg:rounded-[2.5rem] overflow-visible',
            'bg-gradient-to-br from-gray-100 via-white to-gray-50',
            'border border-white/80',
            'shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,1)]',
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-0 px-6 lg:px-12 py-10 lg:py-14 min-h-[14rem] lg:min-h-[18rem]">
            {/* Text — left */}
            <div className="lg:col-span-6 order-2 lg:order-1 text-center lg:text-left">
              <h2
                className="text-[1.6rem] lg:text-[2.4rem] leading-[1.1] text-gray-900 mb-5 lg:mb-7"
                style={{ fontFamily: 'var(--font-unna), Georgia, serif', fontWeight: 400, letterSpacing: '0' }}
              >
                <span
                  className="inline-block"
                  style={{ transform: 'scaleY(1.2)', transformOrigin: 'bottom left' }}
                >
                  Laissez vos clients vivre vos<br />
                  produits avant de les acheter.
                </span>
              </h2>

              <Link
                href="/signup"
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[0.9rem] font-medium',
                  'bg-gray-900 text-white',
                  'shadow-md shadow-gray-900/15',
                  'hover:bg-gray-800 hover:shadow-gray-900/25',
                  'transition-all duration-200 group',
                )}
              >
                Commencer en 3D
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Image — right, overflows top for 3D pop */}
            <div className="lg:col-span-6 order-1 lg:order-2 relative h-[14rem] sm:h-[16rem] lg:h-[16rem]">
              <motion.div
                initial={{ opacity: 0, y: 40, rotate: -2 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                className="absolute inset-x-0 -top-24 sm:-top-32 lg:-top-44 -bottom-2 lg:-bottom-6"
                style={{ filter: 'drop-shadow(0 30px 40px rgba(15,23,42,0.18))' }}
              >
                <div className="relative w-full h-full lg:scale-[1.4] origin-center">
                  <Image
                    src="/images/section/section6.png"
                    alt="Aperçu d'un produit en réalité augmentée avec QR code"
                    fill
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    quality={92}
                    className="object-contain object-center"
                    priority={false}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
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
      <div className="mx-auto max-w-7xl px-6 py-14">
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
        <ImmersiveSection />
        <PipelineVisualSection />
        <CataloguesARSection />
        <CreationFlowSection />
        <FinalCtaSection />
      </main>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
