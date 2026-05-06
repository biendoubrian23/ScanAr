'use client';

import { Plus, Trash2, ArrowDown, ArrowUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  STATS_BLOCK_DESCRIPTIONS,
  STATS_BLOCK_LABELS,
  type StatsBlock,
  type StatsBlockType,
  type StatsConfig,
} from '@/lib/types';

interface StatsConfigEditorProps {
  visible:  boolean;
  config:   StatsConfig;
  onChange: (next: { visible: boolean; config: StatsConfig }) => void;
}

const ALL_TYPES: StatsBlockType[] = ['summary', 'top_viewed', 'top_priced', 'by_category', 'recent'];

function defaultBlock(type: StatsBlockType): StatsBlock {
  switch (type) {
    case 'summary':     return { type };
    case 'top_viewed':  return { type, limit: 5 };
    case 'top_priced':  return { type, limit: 5, sort: 'desc' };
    case 'by_category': return { type, limit: 3 };
    case 'recent':      return { type, limit: 5 };
  }
}

export function StatsConfigEditor({ visible, config, onChange }: StatsConfigEditorProps) {
  const blocks = config.blocks;

  const setVisible = (v: boolean) => {
    // First time enabled with no blocks → seed a sensible default
    const next: StatsConfig =
      v && blocks.length === 0
        ? { blocks: [defaultBlock('summary'), defaultBlock('top_viewed')] }
        : config;
    onChange({ visible: v, config: next });
  };

  const updateBlock = (idx: number, patch: Partial<StatsBlock>) => {
    const next = blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    onChange({ visible, config: { blocks: next } });
  };

  const removeBlock = (idx: number) => {
    onChange({ visible, config: { blocks: blocks.filter((_, i) => i !== idx) } });
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ visible, config: { blocks: next } });
  };

  const addBlock = (type: StatsBlockType) => {
    onChange({ visible, config: { blocks: [...blocks, defaultBlock(type)] } });
  };

  const usedTypes = new Set(blocks.map((b) => b.type));
  // Allow adding the same type multiple times only for top_viewed/top_priced/recent.
  // summary + by_category make sense only once.
  const isReusable = (type: StatsBlockType): boolean =>
    type === 'top_viewed' || type === 'top_priced' || type === 'recent';
  const availableTypes = ALL_TYPES.filter((t) => isReusable(t) || !usedTypes.has(t));

  return (
    <div className="space-y-4">
      <ToggleRow
        label="Afficher cette section sur la page publique"
        description="Si activé, les visiteurs voient le panneau juste avant le footer."
        checked={visible}
        onChange={setVisible}
      />

      {visible && (
        <div className="space-y-3 pt-2">
          {blocks.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
              <Sparkles className="w-7 h-7 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">
                Ajoutez au moins un bloc pour activer le panneau.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {blocks.map((block, idx) => (
                <li key={idx}>
                  <BlockEditor
                    block={block}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                    onChange={(patch) => updateBlock(idx, patch)}
                    onRemove={() => removeBlock(idx)}
                    onMoveUp={() => moveBlock(idx, -1)}
                    onMoveDown={() => moveBlock(idx, 1)}
                  />
                </li>
              ))}
            </ul>
          )}

          {availableTypes.length > 0 && (
            <AddBlockMenu types={availableTypes} onAdd={addBlock} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Block editor ─────────────────────────────────────────────────────────────
function BlockEditor({
  block,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block:        StatsBlock;
  isFirst:      boolean;
  isLast:       boolean;
  onChange:     (patch: Partial<StatsBlock>) => void;
  onRemove:     () => void;
  onMoveUp:     () => void;
  onMoveDown:   () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const showLimit = block.type !== 'summary';
  const showSort  = block.type === 'top_priced';

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Monter"
            className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Descendre"
            className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {block.title?.trim() || STATS_BLOCK_LABELS[block.type]}
          </p>
          <p className="text-[11px] text-gray-500 truncate">
            {STATS_BLOCK_DESCRIPTIONS[block.type]}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Réduire' : 'Développer'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Supprimer le bloc"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </header>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
          <label className="block">
            <span className="block text-[11px] font-medium text-gray-600 mb-1">
              Titre affiché (optionnel)
            </span>
            <input
              type="text"
              value={block.title ?? ''}
              onChange={(e) => onChange({ title: e.target.value || undefined })}
              placeholder={STATS_BLOCK_LABELS[block.type]}
              maxLength={60}
              className="w-full h-8 px-2.5 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {showLimit && (
              <label className="block">
                <span className="block text-[11px] font-medium text-gray-600 mb-1">
                  Nombre d&apos;éléments
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={block.limit ?? 5}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    onChange({ limit: Number.isFinite(n) ? Math.max(1, Math.min(20, n)) : 5 });
                  }}
                  className="w-full h-8 px-2.5 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </label>
            )}

            {showSort && (
              <label className="block">
                <span className="block text-[11px] font-medium text-gray-600 mb-1">
                  Sens du tri
                </span>
                <select
                  value={block.sort ?? 'desc'}
                  onChange={(e) => onChange({ sort: e.target.value === 'asc' ? 'asc' : 'desc' })}
                  className="w-full h-8 px-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="desc">Du plus cher au moins cher</option>
                  <option value="asc">Du moins cher au plus cher</option>
                </select>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add-block menu ──────────────────────────────────────────────────────────
function AddBlockMenu({
  types, onAdd,
}: {
  types: StatsBlockType[];
  onAdd: (t: StatsBlockType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed border-gray-300',
          'text-sm text-gray-600 hover:text-brand-700 hover:border-brand-400 hover:bg-brand-50/40 transition-colors',
        )}
      >
        <Plus className="w-3.5 h-3.5" />
        Ajouter un bloc
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg p-1.5">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onAdd(t); setOpen(false); }}
              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{STATS_BLOCK_LABELS[t]}</p>
              <p className="text-[11px] text-gray-500">{STATS_BLOCK_DESCRIPTIONS[t]}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Toggle row (mirrors the one in edit page for visual consistency) ────────
function ToggleRow({
  label, description, checked, onChange,
}: {
  label:        string;
  description?: string;
  checked:      boolean;
  onChange:     (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
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
          'relative w-10 h-6 rounded-full transition-colors shrink-0',
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
