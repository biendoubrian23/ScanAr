'use client';

import { useState } from 'react';
import {
  AlertCircle,
  User as UserIcon,
  Share2,
  Boxes,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type Catalogue,
  type CatalogueDesign,
  type CatalogueLayout,
  type CatalogueTheme,
  type FontFamily,
  FONT_LABELS,
  CATALOGUE_THEME_LABELS,
  DEFAULT_DESIGN,
  mergeDesign,
} from '@/lib/types';

interface DesignEditorProps {
  catalogue: Catalogue;
  onDesignChange: (design: Partial<CatalogueDesign>) => void;
  onError:        (msg: string) => void;
}

type TabId = 'identity' | 'socials' | 'products' | 'colors';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identité', icon: UserIcon },
  { id: 'socials',  label: 'Réseaux',  icon: Share2   },
  { id: 'products', label: 'Produits', icon: Boxes    },
  { id: 'colors',   label: 'Couleurs', icon: Palette  },
];

// Patch a leaf in a nested design object (immutable). Used by every slider/select.
function patchDesign(
  current: Partial<CatalogueDesign>,
  patch: Partial<CatalogueDesign>,
): Partial<CatalogueDesign> {
  const next: Partial<CatalogueDesign> = { ...current };
  for (const k of Object.keys(patch) as (keyof CatalogueDesign)[]) {
    const v = patch[k];
    if (v !== undefined) {
      // shallow-merge for nested objects so partial updates don't overwrite siblings
      const existing = (current[k] ?? {}) as Record<string, unknown>;
      const incoming = (v as Record<string, unknown>);
      (next as Record<string, unknown>)[k] = { ...existing, ...incoming };
    }
  }
  return next;
}

export function DesignEditor({ catalogue, onDesignChange }: DesignEditorProps) {
  const [tab, setTab] = useState<TabId>('identity');
  const merged = mergeDesign(catalogue.design);
  const layout: CatalogueLayout = catalogue.layout;
  const hasSocials = Object.values(catalogue.socials ?? {}).some((v) => !!v);

  const update = (patch: Partial<CatalogueDesign>) => {
    onDesignChange(patchDesign(catalogue.design, patch));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                active ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'identity' && <IdentityTab merged={merged} update={update} layout={layout} />}
        {tab === 'socials'  && <SocialsTab  merged={merged} update={update} hasSocials={hasSocials} />}
        {tab === 'products' && <ProductsTab merged={merged} update={update} layout={layout} />}
        {tab === 'colors'   && <ColorsTab   merged={merged} update={update} />}
      </div>
    </div>
  );
}

// ─── Reusable atoms ───────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step = 1, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs tabular-nums text-gray-500">{value}{suffix ?? ''}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
    </label>
  );
}

function Select<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value ? 'true' : 'false'}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          value ? 'bg-brand-500' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            value ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  );
}

function ColorInput({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer"
          aria-label={`Color picker — ${label}`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono text-gray-900 focus:outline-none focus:border-brand-400"
        />
      </div>
    </label>
  );
}

// ─── Tab : Identité ───────────────────────────────────────────────────────────

function IdentityTab({ merged, update, layout }: { merged: CatalogueDesign; update: (p: Partial<CatalogueDesign>) => void; layout: CatalogueLayout }) {
  const fontOptions = (Object.keys(FONT_LABELS) as FontFamily[]).map((f) => ({ value: f, label: FONT_LABELS[f] }));
  const isHorizontal = layout === 'horizontal';

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {!isHorizontal && (
        <Select
          label="Disposition de l'en-tête"
          value={merged.header.layout}
          options={[
            { value: 'avatar-top',   label: 'Avatar en haut' },
            { value: 'avatar-left',  label: 'Avatar à gauche' },
            { value: 'avatar-right', label: 'Avatar à droite' },
          ]}
          onChange={(v) => update({ header: { ...merged.header, layout: v } })}
        />
      )}
      <Select
        label="Alignement"
        value={merged.header.align}
        options={[
          { value: 'left',   label: 'Gauche' },
          { value: 'center', label: 'Centre' },
          { value: 'right',  label: 'Droite' },
        ]}
        onChange={(v) => update({ header: { ...merged.header, align: v } })}
      />

      {!isHorizontal && (
        <div className="sm:col-span-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-700 mb-3">Avatar</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Toggle
              label="Afficher"
              value={merged.header.avatar.show}
              onChange={(v) => update({ header: { ...merged.header, avatar: { ...merged.header.avatar, show: v } } })}
            />
            <Slider
              label="Taille"
              value={merged.header.avatar.size}
              min={48} max={200} suffix=" px"
              onChange={(v) => update({ header: { ...merged.header, avatar: { ...merged.header.avatar, size: v } } })}
            />
            <Select
              label="Forme"
              value={merged.header.avatar.radius}
              options={[
                { value: 'circle',  label: 'Cercle' },
                { value: 'rounded', label: 'Arrondi' },
                { value: 'square',  label: 'Carré' },
              ]}
              onChange={(v) => update({ header: { ...merged.header, avatar: { ...merged.header.avatar, radius: v } } })}
            />
          </div>
        </div>
      )}

      <div className="sm:col-span-2 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">Titre</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Select
            label="Police"
            value={merged.header.title.font}
            options={fontOptions}
            onChange={(v) => update({ header: { ...merged.header, title: { ...merged.header.title, font: v } } })}
          />
          <Slider
            label="Taille"
            value={merged.header.title.size}
            min={16} max={56} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, title: { ...merged.header.title, size: v } } })}
          />
          <Select
            label="Graisse"
            value={String(merged.header.title.weight)}
            options={[
              { value: '400', label: 'Régulier' },
              { value: '500', label: 'Medium' },
              { value: '600', label: 'Semi-bold' },
              { value: '700', label: 'Bold' },
              { value: '800', label: 'Extra-bold' },
            ]}
            onChange={(v) => update({ header: { ...merged.header, title: { ...merged.header.title, weight: Number(v) as 400 | 500 | 600 | 700 | 800 } } })}
          />
          <label className="block">
            <span className="block text-xs font-medium text-gray-700 mb-1.5">Emoji avant le titre (optionnel)</span>
            <input
              type="text"
              value={merged.header.title.emoji ?? ''}
              onChange={(e) => update({ header: { ...merged.header, title: { ...merged.header.title, emoji: e.target.value } } })}
              placeholder="✨"
              maxLength={4}
              className="w-24 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-brand-400"
            />
          </label>
          <Slider
            label="Marge latérale"
            value={merged.header.title.marginX}
            min={0} max={64} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, title: { ...merged.header.title, marginX: v } } })}
          />
        </div>
      </div>

      <div className="sm:col-span-2 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">Sous-titre</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Toggle
            label="Afficher"
            value={merged.header.subtitle.show}
            onChange={(v) => update({ header: { ...merged.header, subtitle: { ...merged.header.subtitle, show: v } } })}
          />
          <Slider
            label="Taille"
            value={merged.header.subtitle.size}
            min={11} max={22} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, subtitle: { ...merged.header.subtitle, size: v } } })}
          />
          <Select
            label="Police"
            value={merged.header.subtitle.font}
            options={fontOptions}
            onChange={(v) => update({ header: { ...merged.header, subtitle: { ...merged.header.subtitle, font: v } } })}
          />
          <Slider
            label="Marge latérale"
            value={merged.header.subtitle.marginX}
            min={0} max={64} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, subtitle: { ...merged.header.subtitle, marginX: v } } })}
          />
        </div>
      </div>

      <div className="sm:col-span-2 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">Lieu</p>
        <Toggle
          label="Afficher"
          value={merged.header.location.show}
          onChange={(v) => update({ header: { ...merged.header, location: { ...merged.header.location, show: v } } })}
        />
      </div>

      <div className="sm:col-span-2 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">Interligne &amp; marges</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Slider
            label="Marge haut de page"
            value={merged.header.spacing.topInset}
            min={0} max={120} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, spacing: { ...merged.header.spacing, topInset: v } } })}
          />
          <Slider
            label="Titre → sous-titre"
            value={merged.header.spacing.titleToSubtitle}
            min={0} max={48} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, spacing: { ...merged.header.spacing, titleToSubtitle: v } } })}
          />
          <Slider
            label="Sous-titre → lieu"
            value={merged.header.spacing.subtitleToLocation}
            min={0} max={48} suffix=" px"
            onChange={(v) => update({ header: { ...merged.header, spacing: { ...merged.header.spacing, subtitleToLocation: v } } })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Tab : Réseaux ────────────────────────────────────────────────────────────

function SocialsTab({
  merged, update, hasSocials,
}: {
  merged: CatalogueDesign;
  update: (p: Partial<CatalogueDesign>) => void;
  hasSocials: boolean;
}) {
  return (
    <div className="space-y-4">
      {!hasSocials && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px text-amber-600" />
          <span>
            Aucun lien social renseigné — ajoutez Instagram, Email, etc. dans la section <strong>Liens sociaux</strong> ci-dessous pour qu&apos;ils apparaissent dans l&apos;aperçu.
          </span>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
      <Toggle
        label="Afficher la rangée des réseaux"
        value={merged.socials.show}
        onChange={(v) => update({ socials: { ...merged.socials, show: v } })}
      />
      <Select
        label="Style"
        value={merged.socials.layout}
        options={[
          { value: 'pills',   label: 'Pills (icône + label)' },
          { value: 'icons',   label: 'Icônes seules' },
          { value: 'compact', label: 'Compact' },
        ]}
        onChange={(v) => update({ socials: { ...merged.socials, layout: v } })}
      />
      <Slider
        label="Taille des boutons"
        value={merged.socials.size} min={32} max={96} suffix=" px"
        onChange={(v) => update({ socials: { ...merged.socials, size: v } })}
      />
      <Slider
        label="Espacement"
        value={merged.socials.gap} min={4} max={32} suffix=" px"
        onChange={(v) => update({ socials: { ...merged.socials, gap: v } })}
      />
      <Select
        label="Forme"
        value={merged.socials.radius}
        options={[
          { value: 'full', label: 'Cercle' },
          { value: 'lg',   label: 'Arrondi' },
          { value: 'md',   label: 'Carré arrondi' },
        ]}
        onChange={(v) => update({ socials: { ...merged.socials, radius: v } })}
      />
      <Select
        label="Alignement"
        value={merged.socials.align}
        options={[
          { value: 'left',   label: 'Gauche' },
          { value: 'center', label: 'Centre' },
          { value: 'right',  label: 'Droite' },
        ]}
        onChange={(v) => update({ socials: { ...merged.socials, align: v } })}
      />
      </div>
    </div>
  );
}

// ─── Tab : Produits ───────────────────────────────────────────────────────────

function ProductsTab({
  merged, update, layout,
}: {
  merged: CatalogueDesign;
  update: (p: Partial<CatalogueDesign>) => void;
  layout: CatalogueLayout;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Certains réglages sont spécifiques à la disposition <strong>{layout === 'vertical' ? 'verticale' : 'horizontale'}</strong>.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Slider
          label="Taille du titre"
          value={merged.products.titleSize} min={11} max={22} suffix=" px"
          onChange={(v) => update({ products: { ...merged.products, titleSize: v } })}
        />
        <Slider
          label="Taille de la description"
          value={merged.products.descSize} min={9} max={18} suffix=" px"
          onChange={(v) => update({ products: { ...merged.products, descSize: v } })}
        />
        <Slider
          label="Taille du prix"
          value={merged.products.priceSize} min={11} max={24} suffix=" px"
          onChange={(v) => update({ products: { ...merged.products, priceSize: v } })}
        />
        <Slider
          label="Rayon des cards"
          value={merged.products.radius} min={4} max={36} suffix=" px"
          onChange={(v) => update({ products: { ...merged.products, radius: v } })}
        />
        <Slider
          label="Marge extérieure (vs bords du téléphone)"
          value={merged.products.outerInset} min={0} max={48} suffix=" px"
          onChange={(v) => update({ products: { ...merged.products, outerInset: v } })}
        />
      </div>

      {layout === 'vertical' && (
        <div className="grid sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          <p className="sm:col-span-3 text-xs font-semibold text-gray-700">Disposition verticale</p>
          <Slider
            label="Taille de l'image"
            value={merged.products.thumbSize} min={40} max={112} suffix=" px"
            onChange={(v) => update({ products: { ...merged.products, thumbSize: v } })}
          />
          <Slider
            label="Espacement vertical"
            value={merged.products.gap} min={2} max={28} suffix=" px"
            onChange={(v) => update({ products: { ...merged.products, gap: v } })}
          />
          <Slider
            label="Marge intérieure"
            value={merged.products.inset} min={0} max={28} suffix=" px"
            onChange={(v) => update({ products: { ...merged.products, inset: v } })}
          />
        </div>
      )}

      {layout === 'horizontal' && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <p className="sm:col-span-3 text-xs font-semibold text-gray-700">Disposition horizontale</p>
            <Slider
              label="Largeur de la card"
              value={merged.products.cardWidth} min={70} max={95} suffix=" %"
              onChange={(v) => update({ products: { ...merged.products, cardWidth: v } })}
            />
            <Slider
              label="Aperçu latéral (peek)"
              value={merged.products.peek} min={2} max={20} suffix=" %"
              onChange={(v) => update({ products: { ...merged.products, peek: v } })}
            />
            <Slider
              label="Hauteur de la card"
              value={merged.products.cardHeight} min={300} max={680} suffix=" px"
              onChange={(v) => update({ products: { ...merged.products, cardHeight: v } })}
            />
            <Slider
              label="Hauteur de l'image"
              value={merged.products.imageHeight} min={140} max={560} suffix=" px"
              onChange={(v) => update({ products: { ...merged.products, imageHeight: v } })}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <p className="sm:col-span-3 text-xs font-semibold text-gray-700">Onglets de catégories</p>
            <Select
              label="Police"
              value={merged.tabs.font}
              options={(Object.keys(FONT_LABELS) as FontFamily[]).map((f) => ({ value: f, label: FONT_LABELS[f] }))}
              onChange={(v) => update({ tabs: { ...merged.tabs, font: v } })}
            />
            <Slider
              label="Taille du texte"
              value={merged.tabs.size} min={10} max={22} suffix=" px"
              onChange={(v) => update({ tabs: { ...merged.tabs, size: v } })}
            />
            <Select
              label="Graisse"
              value={String(merged.tabs.weight)}
              options={[
                { value: '400', label: 'Régulier' },
                { value: '500', label: 'Medium' },
                { value: '600', label: 'Semi-bold' },
                { value: '700', label: 'Bold' },
                { value: '800', label: 'Extra-bold' },
              ]}
              onChange={(v) => update({ tabs: { ...merged.tabs, weight: Number(v) as 400 | 500 | 600 | 700 | 800 } })}
            />
            <Slider
              label="Marge au-dessus (description → onglets)"
              value={merged.tabs.marginTop} min={0} max={64} suffix=" px"
              onChange={(v) => update({ tabs: { ...merged.tabs, marginTop: v } })}
            />
            <Slider
              label="Marge latérale (bord du téléphone)"
              value={merged.tabs.marginX} min={0} max={48} suffix=" px"
              onChange={(v) => update({ tabs: { ...merged.tabs, marginX: v } })}
            />
            <Slider
              label="Espacement entre onglets"
              value={merged.tabs.gap} min={0} max={32} suffix=" px"
              onChange={(v) => update({ tabs: { ...merged.tabs, gap: v } })}
            />
            <ColorInput
              label="Fond onglet actif"
              value={merged.tabs.activeBg ?? '#000000'}
              onChange={(v) => update({ tabs: { ...merged.tabs, activeBg: v } })}
            />
            <ColorInput
              label="Texte onglet actif"
              value={merged.tabs.activeText ?? '#ffffff'}
              onChange={(v) => update({ tabs: { ...merged.tabs, activeText: v } })}
            />
            <ColorInput
              label="Texte onglets inactifs"
              value={merged.tabs.inactiveText ?? '#6b7280'}
              onChange={(v) => update({ tabs: { ...merged.tabs, inactiveText: v } })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab : Couleurs ───────────────────────────────────────────────────────────

function ColorsTab({ merged, update }: { merged: CatalogueDesign; update: (p: Partial<CatalogueDesign>) => void }) {
  return (
    <div className="space-y-4">
      <Select
        label="Mode d'arrière-plan"
        value={merged.background.mode === 'cover' ? 'preset' : merged.background.mode}
        options={[
          { value: 'preset',   label: 'Preset (palette)' },
          { value: 'gradient', label: 'Dégradé personnalisé' },
        ]}
        onChange={(v) => update({ background: { ...merged.background, mode: v } })}
      />

      {merged.background.mode === 'preset' && (
        <Select
          label="Palette"
          value={merged.background.preset ?? 'pink'}
          options={(['pink','beige','indigo','dark','minimal'] as CatalogueTheme[]).map((p) => ({ value: p, label: CATALOGUE_THEME_LABELS[p] }))}
          onChange={(v) => update({ background: { ...merged.background, preset: v } })}
        />
      )}

      {merged.background.mode === 'gradient' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <ColorInput
            label="Couleur de départ"
            value={merged.background.gradient?.from ?? DEFAULT_DESIGN.background.gradient!.from}
            onChange={(v) => update({ background: { ...merged.background, gradient: { ...DEFAULT_DESIGN.background.gradient!, ...merged.background.gradient, from: v } } })}
          />
          <ColorInput
            label="Couleur de fin"
            value={merged.background.gradient?.to ?? DEFAULT_DESIGN.background.gradient!.to}
            onChange={(v) => update({ background: { ...merged.background, gradient: { ...DEFAULT_DESIGN.background.gradient!, ...merged.background.gradient, to: v } } })}
          />
          <Slider
            label="Angle"
            value={merged.background.gradient?.angle ?? 180}
            min={0} max={360} suffix="°"
            onChange={(v) => update({ background: { ...merged.background, gradient: { ...DEFAULT_DESIGN.background.gradient!, ...merged.background.gradient, angle: v } } })}
          />
          <div
            className="sm:col-span-3 h-16 rounded-xl border border-gray-200"
            style={{
              background: `linear-gradient(${merged.background.gradient?.angle ?? 180}deg, ${merged.background.gradient?.from ?? '#FCE7F3'} 0%, ${merged.background.gradient?.to ?? '#FBCFE8'} 100%)`,
            }}
          />
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 grid sm:grid-cols-2 gap-4">
        <p className="sm:col-span-2 text-xs font-semibold text-gray-700">Couleur d&apos;accent (boutons « Voir en AR »)</p>
        <ColorInput
          label="Couleur du bouton"
          value={merged.accent.color}
          onChange={(v) => update({ accent: { ...merged.accent, color: v } })}
        />
        <ColorInput
          label="Couleur du texte"
          value={merged.accent.textColor}
          onChange={(v) => update({ accent: { ...merged.accent, textColor: v } })}
        />
      </div>
    </div>
  );
}

// ─── Mobile lock ──────────────────────────────────────────────────────────────

export function DesignEditorMobileLock() {
  return (
    <div className="lg:hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-900">Éditeur de design : desktop uniquement</p>
        <p className="text-xs text-amber-800 mt-1">
          La personnalisation fine (sliders, color pickers, presets) demande un grand écran.
          Connectez-vous depuis un ordinateur pour ajuster votre catalogue.
        </p>
      </div>
    </div>
  );
}

export default DesignEditor;
