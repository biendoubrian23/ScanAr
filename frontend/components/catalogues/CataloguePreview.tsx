'use client';

import { useMemo } from 'react';
import { IPhoneFrame } from './IPhoneFrame';
import { VerticalCatalogueView } from './VerticalCatalogueView';
import { HorizontalCatalogueView } from './HorizontalCatalogueView';
import type { Catalogue, CatalogueItemWithModel, Model3D } from '@/lib/types';

export interface PreviewDraftItem {
  key:                string;
  model_id:           string;
  custom_label:       string;
  custom_description: string;
  price:              string;
  badge:              string;
  category_id:        string | null;
}

interface CataloguePreviewProps {
  catalogue:        Catalogue;
  draftItems:       PreviewDraftItem[];
  models:           Model3D[];
  className?:       string;
  viewportWidth?:   number;
  viewportHeight?:  number;
}

/**
 * Live preview of the catalogue inside an iPhone frame, rendered from the
 * editor's draft state (no DB round-trip). Re-uses the same Vertical /
 * Horizontal views as the public page so what you see here matches /c/<slug>.
 */
export function CataloguePreview({
  catalogue, draftItems, models, className, viewportWidth, viewportHeight,
}: CataloguePreviewProps) {
  const items = useMemo<CatalogueItemWithModel[]>(() => {
    const modelById = new Map(models.map((m) => [m.id, m]));
    const now = new Date().toISOString();

    return draftItems
      .map((d, idx) => {
        const model = modelById.get(d.model_id);
        if (!model) return null;
        const item: CatalogueItemWithModel = {
          id:                 d.key,
          catalogue_id:       catalogue.id,
          model_id:           d.model_id,
          position:           idx,
          custom_label:       d.custom_label.trim()       || null,
          custom_description: d.custom_description.trim() || null,
          price:              d.price.trim()              || null,
          badge:              d.badge.trim()              || null,
          category_id:        d.category_id,
          view_count:         0,
          created_at:         now,
          updated_at:         now,
          model,
        };
        return item;
      })
      .filter((x): x is CatalogueItemWithModel => x !== null);
  }, [draftItems, models, catalogue.id]);

  return (
    <IPhoneFrame
      className={className}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      {catalogue.layout === 'horizontal' ? (
        <HorizontalCatalogueView catalogue={catalogue} items={items} previewMode />
      ) : (
        <VerticalCatalogueView catalogue={catalogue} items={items} previewMode />
      )}
    </IPhoneFrame>
  );
}
