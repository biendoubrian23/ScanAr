'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Box as BoxIcon,
  Smartphone,
  X,
  ChevronDown,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useModels } from '@/lib/stores/modelsStore';
import { useCatalogues } from '@/lib/stores/cataloguesStore';
import { cn } from '@/lib/utils';
import { AvatarUploader } from '@/components/catalogues/AvatarUploader';
import { CataloguePreview } from '@/components/catalogues/CataloguePreview';
import { StatsConfigEditor } from '@/components/catalogues/StatsConfigEditor';
import type {
  Catalogue,
  CatalogueCategory,
  CatalogueItem,
  CatalogueItemWithModel,
  CatalogueSocials,
  CatalogueTheme,
  StatsConfig,
} from '@/lib/types';
import { CATALOGUE_THEME_LABELS } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const THEME_SWATCH: Record<CatalogueTheme, string> = {
  pink:    'bg-gradient-to-br from-pink-200 via-fuchsia-200 to-purple-200',
  beige:   'bg-gradient-to-br from-stone-100 via-amber-100 to-orange-100',
  indigo:  'bg-gradient-to-br from-indigo-200 via-blue-200 to-purple-200',
  dark:    'bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900',
  minimal: 'bg-gradient-to-br from-gray-100 via-white to-gray-50',
};

interface DraftItem {
  /** Stable client key — uses item.id when persisted, else a random uuid */
  key:                string;
  model_id:           string;
  custom_label:       string;
  custom_description: string;
  price:              string;
  badge:              string;
  category_id:        string | null;
}

const SOCIAL_FIELDS: { key: keyof CatalogueSocials; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/votreprofil' },
  { key: 'website',   label: 'Site web',  placeholder: 'https://votresite.com' },
  { key: 'email',     label: 'Email',     placeholder: 'contact@votresite.com' },
  { key: 'whatsapp',  label: 'WhatsApp',  placeholder: 'https://wa.me/33612345678' },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/votrepage' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@vous' },
  { key: 'store',     label: 'Boutique',  placeholder: 'https://boutique.com' },
];

export default function CatalogueEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const catalogueId = params?.id;

  const { models } = useModels();
  const { refresh: refreshCatalogues, patchCatalogue } = useCatalogues();

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [notFound, setNotFound]       = useState(false);
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phonePreviewOpen, setPhonePreviewOpen] = useState(false);
  const [openItemKeys, setOpenItemKeys] = useState<Set<string>>(new Set());

  const toggleItemExpand = (key: string) => {
    setOpenItemKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Form state ───────────────────────────────────────────────────────────
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!catalogueId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [catRes, itemsRes] = await Promise.all([
          fetch(`/api/catalogues/${catalogueId}`),
          fetch(`/api/catalogues/${catalogueId}/items`),
        ]);
        if (cancelled) return;

        if (catRes.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const catBody   = await catRes.json();
        const itemsBody = await itemsRes.json();

        if (!catBody.success) {
          showToast('error', catBody.error ?? 'Erreur de chargement.');
          setLoading(false);
          return;
        }

        setCatalogue(catBody.data as Catalogue);

        if (itemsBody.success) {
          const items = (itemsBody.data as CatalogueItemWithModel[]) ?? [];
          setDraftItems(
            items.map((it) => ({
              key:                it.id,
              model_id:           it.model_id,
              custom_label:       it.custom_label       ?? '',
              custom_description: it.custom_description ?? '',
              price:              it.price              ?? '',
              badge:              it.badge              ?? '',
              category_id:        it.category_id,
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [catalogueId]);

  // ── Catalogue field helpers ──────────────────────────────────────────────
  const updateField = <K extends keyof Catalogue>(key: K, value: Catalogue[K]) => {
    setCatalogue((c) => (c ? { ...c, [key]: value } : c));
  };

  const updateSocial = (key: keyof CatalogueSocials, value: string) => {
    setCatalogue((c) =>
      c
        ? {
            ...c,
            socials: { ...c.socials, [key]: value.trim() ? value : undefined } as CatalogueSocials,
          }
        : c,
    );
  };

  // ── Categories ───────────────────────────────────────────────────────────
  const addCategory = () => {
    if (!catalogue) return;
    const newCat: CatalogueCategory = {
      id:    `cat-${Date.now().toString(36)}`,
      label: 'Nouvelle catégorie',
    };
    updateField('categories', [...catalogue.categories, newCat]);
  };

  const updateCategory = (id: string, label: string) => {
    if (!catalogue) return;
    updateField(
      'categories',
      catalogue.categories.map((c) => (c.id === id ? { ...c, label } : c)),
    );
  };

  const removeCategory = (id: string) => {
    if (!catalogue) return;
    updateField('categories', catalogue.categories.filter((c) => c.id !== id));
    // Detach items from the removed category
    setDraftItems((items) => items.map((it) => (it.category_id === id ? { ...it, category_id: null } : it)));
  };

  // ── Items: add / remove / reorder / edit ─────────────────────────────────
  const addItems = (modelIds: string[]) => {
    setDraftItems((current) => {
      const existing = new Set(current.map((it) => it.model_id));
      const newOnes: DraftItem[] = modelIds
        .filter((id) => !existing.has(id))
        .map((id) => ({
          key:                `new-${id}-${Date.now().toString(36)}`,
          model_id:           id,
          custom_label:       '',
          custom_description: '',
          price:              '',
          badge:              '',
          category_id:        null,
        }));
      return [...current, ...newOnes];
    });
    setShowPicker(false);
  };

  const removeItem = (key: string) => {
    setDraftItems((items) => items.filter((it) => it.key !== key));
  };

  const moveItem = (key: string, dir: -1 | 1) => {
    setDraftItems((items) => {
      const idx = items.findIndex((it) => it.key === key);
      if (idx === -1) return items;
      const target = idx + dir;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setDraftItems((items) => items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!catalogue) return;
    setSaving(true);

    try {
      // 1. PATCH catalogue
      const patchRes = await fetch(`/api/catalogues/${catalogue.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         catalogue.title,
          subtitle:      catalogue.subtitle,
          location:      catalogue.location,
          avatar_url:    catalogue.avatar_url,
          theme:         catalogue.theme,
          categories:    catalogue.categories,
          socials:       catalogue.socials,
          is_active:     catalogue.is_active,
          is_public:     catalogue.is_public,
          stats_visible: catalogue.stats_visible,
          stats_config:  catalogue.stats_config,
        }),
      });
      const patchBody = await patchRes.json();
      if (!patchBody.success) throw new Error(patchBody.error ?? 'Erreur de sauvegarde.');

      // 2. PUT items
      const itemsRes = await fetch(`/api/catalogues/${catalogue.id}/items`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: draftItems.map((it) => ({
            model_id:           it.model_id,
            custom_label:       it.custom_label.trim()       || null,
            custom_description: it.custom_description.trim() || null,
            price:              it.price.trim()              || null,
            badge:              it.badge.trim()              || null,
            category_id:        it.category_id               || null,
          })),
        }),
      });
      const itemsBody = await itemsRes.json();
      if (!itemsBody.success) throw new Error(itemsBody.error ?? 'Erreur sur les produits.');

      // Optimistic update of the global store
      patchCatalogue(catalogue.id, patchBody.data as Catalogue);
      await refreshCatalogues();

      showToast('success', 'Catalogue sauvegardé.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  // ── Eligible models for picker ───────────────────────────────────────────
  const completedModels = useMemo(
    () => models.filter((m) => m.status === 'completed'),
    [models],
  );
  const draftModelIds = useMemo(
    () => new Set(draftItems.map((it) => it.model_id)),
    [draftItems],
  );

  // ── UI states ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardShell title="Modifier le catalogue">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      </DashboardShell>
    );
  }

  if (notFound || !catalogue) {
    return (
      <DashboardShell title="Catalogue introuvable">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Ce catalogue n&apos;existe pas ou ne vous appartient pas.
          </p>
          <Button onClick={() => router.push('/dashboard/catalogues')}>Retour à mes catalogues</Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={catalogue.title || 'Catalogue'}
      subtitle={`/c/${catalogue.slug}`}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPhonePreviewOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            Voir la page
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-4 rounded-xl',
              'bg-brand-600 text-white text-sm font-medium shadow-sm',
              'hover:bg-brand-700 active:bg-brand-800 transition-colors',
              saving && 'opacity-70 cursor-wait',
            )}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      }
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg border',
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700',
          )}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.text}
        </div>
      )}

      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/dashboard/catalogues')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Tous mes catalogues
      </button>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_30rem] gap-6">
        {/* Main column */}
        <div className="space-y-5 min-w-0">

          {/* General */}
          <Section title="Identité du catalogue">
            <Field label="Titre" required>
              <input
                type="text"
                value={catalogue.title}
                onChange={(e) => updateField('title', e.target.value)}
                maxLength={80}
                className="input"
              />
            </Field>
            <Field label="Sous-titre">
              <input
                type="text"
                value={catalogue.subtitle ?? ''}
                onChange={(e) => updateField('subtitle', e.target.value || null)}
                placeholder="Timeless design. Crafted for real life."
                className="input"
              />
            </Field>
            <Field label="Lieu (optionnel)">
              <input
                type="text"
                value={catalogue.location ?? ''}
                onChange={(e) => updateField('location', e.target.value || null)}
                placeholder="Copenhagen, Denmark"
                className="input"
              />
            </Field>
            <div className="pt-1">
              <AvatarUploader
                catalogueId={catalogue.id}
                avatarUrl={catalogue.avatar_url}
                onChange={(updated) => setCatalogue(updated)}
                onError={(msg) => showToast('error', msg)}
              />
            </div>
          </Section>

          {/* Theme */}
          <Section title="Thème">
            <div className="grid grid-cols-5 gap-2">
              {(['minimal', 'pink', 'beige', 'indigo', 'dark'] as CatalogueTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateField('theme', t)}
                  className={cn(
                    'relative aspect-square rounded-xl border-2 overflow-hidden transition-all',
                    catalogue.theme === t
                      ? 'border-brand-500 ring-2 ring-brand-500/30'
                      : 'border-transparent hover:border-gray-300',
                  )}
                  aria-label={CATALOGUE_THEME_LABELS[t]}
                >
                  <div className={cn('w-full h-full', THEME_SWATCH[t])} />
                  {catalogue.theme === t && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">{CATALOGUE_THEME_LABELS[catalogue.theme]}</p>
          </Section>

          {/* Categories */}
          <Section
            title="Catégories"
            description="Onglets affichés en haut du catalogue. Laissez vide pour une vue plate."
            action={
              <button
                type="button"
                onClick={addCategory}
                className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            }
          >
            {catalogue.categories.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucune catégorie — vue plate &laquo; Tous &raquo;.</p>
            ) : (
              <ul className="space-y-2">
                {catalogue.categories.map((cat) => (
                  <li key={cat.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cat.label}
                      onChange={(e) => updateCategory(cat.id, e.target.value)}
                      maxLength={32}
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      aria-label={`Supprimer ${cat.label}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Items */}
          <Section
            title="Produits"
            description="Modèles affichés dans le catalogue, dans l'ordre."
            action={
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un produit
              </button>
            }
          >
            {draftItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                <BoxIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">Aucun produit dans ce catalogue.</p>
                <Button size="sm" onClick={() => setShowPicker(true)}>
                  <Plus className="w-4 h-4" /> Ajouter un produit
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {draftItems.map((item, idx) => {
                  const model = models.find((m) => m.id === item.model_id);
                  const isOpen = openItemKeys.has(item.key);
                  return (
                    <li key={item.key} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      {/* Header — always visible */}
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                          {model?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={model.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleItemExpand(item.key)}
                          className="flex-1 flex items-center gap-1.5 min-w-0 text-left"
                          aria-expanded={isOpen ? 'true' : 'false'}
                        >
                          <p className="text-sm font-medium text-gray-900 truncate flex-1">
                            {model?.name ?? '(modèle introuvable)'}
                          </p>
                          <ChevronDown className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label="Retirer du catalogue"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Expanded body — champs sous la photo */}
                      {isOpen && (
                        <div className="border-t border-gray-200 px-3 pb-3 pt-2.5 space-y-2">
                          {/* Reorder */}
                          <div className="flex items-center gap-2 mb-1">
                            <GripVertical className="w-4 h-4 text-gray-300" aria-hidden="true" />
                            <button
                              type="button"
                              onClick={() => moveItem(item.key, -1)}
                              disabled={idx === 0}
                              aria-label="Monter"
                              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 px-2 py-0.5 rounded border border-gray-200 bg-white"
                            >▲ Monter</button>
                            <button
                              type="button"
                              onClick={() => moveItem(item.key, 1)}
                              disabled={idx === draftItems.length - 1}
                              aria-label="Descendre"
                              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 px-2 py-0.5 rounded border border-gray-200 bg-white"
                            >▼ Descendre</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.custom_label}
                              onChange={(e) => updateItem(item.key, { custom_label: e.target.value })}
                              placeholder={`Nom (${model?.name ?? '…'})`}
                              maxLength={80}
                              className="input text-xs"
                            />
                            <input
                              type="text"
                              value={item.price}
                              onChange={(e) => updateItem(item.key, { price: e.target.value })}
                              placeholder="Prix (ex: 79€)"
                              maxLength={32}
                              className="input text-xs"
                            />
                          </div>
                          <input
                            type="text"
                            value={item.custom_description}
                            onChange={(e) => updateItem(item.key, { custom_description: e.target.value })}
                            placeholder="Description (optionnel)"
                            maxLength={140}
                            className="input text-xs"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.badge}
                              onChange={(e) => updateItem(item.key, { badge: e.target.value })}
                              placeholder="Badge (ex: Nouveau)"
                              maxLength={32}
                              className="input text-xs"
                            />
                            <select
                              aria-label="Catégorie"
                              value={item.category_id ?? ''}
                              onChange={(e) => updateItem(item.key, { category_id: e.target.value || null })}
                              className="input text-xs"
                            >
                              <option value="">— Catégorie —</option>
                              {catalogue.categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Socials */}
          <Section
            title="Liens sociaux"
            description="Affichés en haut du catalogue (linktree) ou dans le footer (carousel)."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {SOCIAL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <input
                    type="text"
                    value={catalogue.socials[f.key] ?? ''}
                    onChange={(e) => updateSocial(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="input"
                  />
                </Field>
              ))}
            </div>
          </Section>

          {/* Stats panel — owner-controlled, visitor-facing */}
          <Section
            title="Panneau stats public"
            description="Bloc additionnel affiché juste avant le footer sur la page publique."
          >
            <StatsConfigEditor
              visible={catalogue.stats_visible ?? false}
              config={catalogue.stats_config ?? { blocks: [] }}
              onChange={({ visible, config }) =>
                setCatalogue((c) =>
                  c ? { ...c, stats_visible: visible, stats_config: config } : c,
                )
              }
            />
          </Section>
        </div>

        {/* Side column */}
        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          {/* Live iPhone preview — hidden on mobile, click "Voir la page" instead */}
          <section className="hidden xl:block bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Aperçu live</h2>
              <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">
                {catalogue.layout === 'horizontal' ? 'Horizontal' : 'Vertical'}
              </span>
            </div>
            <CataloguePreview
              catalogue={catalogue}
              draftItems={draftItems}
              models={models}
              viewportWidth={350}
              viewportHeight={720}
            />
          </section>

          <Section title="État du catalogue">
            <ToggleRow
              label="Actif"
              description="Si désactivé, la page publique renvoie une erreur."
              icon={catalogue.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              checked={catalogue.is_active}
              onChange={(v) => updateField('is_active', v)}
            />
            <ToggleRow
              label="Public"
              description="Si désactivé, seul le propriétaire connecté peut le voir."
              icon={catalogue.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              checked={catalogue.is_public}
              onChange={(v) => updateField('is_public', v)}
            />
          </Section>

          <Section title="Lien public">
            <p className="font-mono text-xs text-gray-700 break-all bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              {APP_URL}/c/{catalogue.slug}
            </p>
            {catalogue.qr_url && (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={catalogue.qr_url} alt="QR code" className="w-20 h-20 rounded-lg border border-gray-200 p-1 bg-white" />
                <div className="text-xs text-gray-500">
                  Scanner ce QR ouvre la page publique du catalogue.
                </div>
              </div>
            )}
          </Section>

          <Section title="Statistiques">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Vues</span>
              <span className="font-semibold tabular-nums">{catalogue.view_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Produits</span>
              <span className="font-semibold tabular-nums">{draftItems.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Catégories</span>
              <span className="font-semibold tabular-nums">{catalogue.categories.length}</span>
            </div>
          </Section>
        </div>
      </div>

      {/* Inline styles for `.input` */}
      <style jsx>{`
        :global(.input) {
          width: 100%;
          height: 2.25rem;
          padding: 0 0.625rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          font-size: 0.875rem;
          background: white;
          transition: border-color 120ms, box-shadow 120ms;
        }
        :global(.input:focus) {
          outline: none;
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.15);
        }
        :global(textarea.input) {
          height: auto;
          padding: 0.5rem 0.625rem;
        }
      `}</style>

      {/* Phone preview modal */}
      {phonePreviewOpen && catalogue && (
        <PhonePreviewModal
          url={`${APP_URL}/c/${catalogue.slug}`}
          onClose={() => setPhonePreviewOpen(false)}
        />
      )}

      {/* Model picker modal */}
      <ModelPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        models={completedModels}
        excludedIds={draftModelIds}
        onConfirm={addItems}
      />
    </DashboardShell>
  );
}

// ─── Section wrapper (accordéon) ─────────────────────────────────────────────
function Section({
  title,
  description,
  action,
  children,
  defaultOpen = true,
}: {
  title:        string;
  description?: string;
  action?:      React.ReactNode;
  children:     React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-2 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {action && (
            <span role="presentation" onClick={(e) => e.stopPropagation()}>
              {action}
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label:     string;
  required?: boolean;
  children:  React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  label:        string;
  description?: string;
  icon:         React.ReactNode;
  checked:      boolean;
  onChange:     (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
            checked && 'translate-x-4',
          )}
        />
      </button>
    </div>
  );
}

// ─── Phone preview modal ─────────────────────────────────────────────────────
function PhonePreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Fermer l'aperçu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* iPhone frame */}
        <div className="relative bg-black rounded-[3rem] p-3 w-[344px] shadow-[0_30px_80px_rgba(0,0,0,0.7)] ring-[3px] ring-white/10">
          {/* Notch */}
          <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-10" />

          {/* Screen */}
          <div className="rounded-[2.4rem] overflow-hidden w-[320px] h-[660px]">
            <iframe
              src={url}
              className="w-full h-full border-none"
              title="Aperçu du catalogue"
            />
          </div>

          {/* Home indicator */}
          <div className="flex justify-center mt-2">
            <div className="w-24 h-1 rounded-full bg-white/25" />
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/60 hover:text-white underline underline-offset-2 transition-colors"
        >
          Ouvrir dans le navigateur →
        </a>
      </div>
    </div>
  );
}

// ─── Model picker modal ──────────────────────────────────────────────────────
function ModelPickerModal({
  isOpen,
  onClose,
  models,
  excludedIds,
  onConfirm,
}: {
  isOpen:      boolean;
  onClose:     () => void;
  models:      ReturnType<typeof useModels>['models'];
  excludedIds: Set<string>;
  onConfirm:   (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) setSelected(new Set());
  }, [isOpen]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  const eligible = models.filter((m) => !excludedIds.has(m.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Ajouter des produits</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Sélectionnez les modèles 3D à inclure dans ce catalogue.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fermer"
          >
            <Trash2 className="w-4 h-4 rotate-45" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {eligible.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              {models.length === 0
                ? 'Aucun modèle 3D terminé. Créez-en un depuis la page Modèles.'
                : 'Tous vos modèles sont déjà dans ce catalogue.'}
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {eligible.map((m) => {
                const isSelected = selected.has(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50'
                          : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {m.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.object_type}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300',
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button
              onClick={() => onConfirm(Array.from(selected))}
              disabled={selected.size === 0}
            >
              Ajouter {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
