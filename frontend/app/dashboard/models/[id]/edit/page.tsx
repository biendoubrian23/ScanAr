'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useModels } from '@/lib/stores/modelsStore';
import {
  OBJECT_TYPE_LABELS,
  type ObjectType,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const TYPES: ObjectType[] = [
  'object', 'furniture', 'clothing', 'vehicle', 'building', 'character', 'other',
];

export default function ModelEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { models, loading, refresh } = useModels();

  const model = useMemo(() => models.find((m) => m.id === params.id), [models, params.id]);

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [objectType, setObjectType]   = useState<ObjectType>('object');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!model) return;
    setName(model.name);
    setDescription(model.description ?? '');
    setObjectType(model.object_type ?? 'object');
  }, [model]);

  if (!loading && !model) {
    return (
      <DashboardShell title="Modèle introuvable" subtitle="Ce modèle n'existe pas ou a été supprimé.">
        <Link
          href="/dashboard/models"
          className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Retour aux modèles
        </Link>
      </DashboardShell>
    );
  }

  if (!model) {
    return (
      <DashboardShell title="Chargement…">
        <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse max-w-2xl" />
      </DashboardShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || model.name,
          description: description.trim() || null,
          object_type: objectType,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'La sauvegarde a échoué.');
        return;
      }
      await refresh();
      router.push(`/dashboard/models/${model.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="Éditer le modèle" subtitle={model.name}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link href="/dashboard/models" className="hover:text-gray-900 transition-colors">Mes modèles</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/dashboard/models/${model.id}`} className="hover:text-gray-900 transition-colors truncate">
          {model.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">Édition</span>
      </nav>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <Input
            label="Nom du modèle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="object-type" className="text-sm font-medium text-gray-700">
              Type d'objet
            </label>
            <select
              id="object-type"
              value={objectType}
              onChange={(e) => setObjectType(e.target.value as ObjectType)}
              disabled={saving}
              className={cn(
                'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900',
                'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                'hover:border-gray-300 transition-colors',
                saving && 'opacity-50 cursor-not-allowed',
              )}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{OBJECT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={4}
              placeholder="Une courte description visible sur la page du modèle…"
              className={cn(
                'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
                'placeholder:text-gray-400 resize-none',
                'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                'hover:border-gray-300 transition-colors',
                saving && 'opacity-50 cursor-not-allowed',
              )}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            href={`/dashboard/models/${model.id}`}
            variant="secondary"
          >
            Annuler
          </Button>
          <Button type="submit" loading={saving}>
            <CheckCircle2 className="w-4 h-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}
