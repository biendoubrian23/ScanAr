'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { useUploadStore } from '@/lib/stores/uploadStore';
import { OBJECT_TYPE_LABELS, type AllowedMimeType, type ObjectType } from '@/lib/types';
import { cn } from '@/lib/utils';

const ALLOWED_MIME: AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 4;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (modelId: string) => void;
}

const TYPES: ObjectType[] = [
  'object', 'furniture', 'clothing', 'vehicle', 'building', 'character', 'other',
];

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { startUpload, isUploading, uploadError } = useUploadStore();

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles]           = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [name, setName]             = useState('');
  const [objectType, setObjectType] = useState<ObjectType>('object');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manage object URL lifecycle so we don't leak memory across renders.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleFilesAccepted = (incoming: File[]) => {
    setCameraError(null);
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, MAX_FILES);
      // Auto-name from the first file if name is empty
      if (!name && merged[0]) {
        setName(merged[0].name.replace(/\.[^.]+$/, ''));
      }
      return merged;
    });
  };

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Camera capture (single shot per click — user can repeat)
  const handleCameraClick = () => {
    setCameraError(null);
    cameraInputRef.current?.click();
  };

  const handleCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type as AllowedMimeType)) {
      setCameraError("Format invalide. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setCameraError('La photo dépasse la limite de 10 Mo.');
      return;
    }
    if (files.length >= MAX_FILES) {
      setCameraError(`Maximum ${MAX_FILES} images.`);
      return;
    }
    handleFilesAccepted([f]);
  };

  const reset = () => {
    setFiles([]);
    setName('');
    setObjectType('object');
    setCameraError(null);
  };

  const handleClose = () => {
    if (isUploading) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    const created = await startUpload(files, name || files[0].name);
    if (created) {
      if (objectType !== 'object') {
        fetch(`/api/models/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ object_type: objectType }),
        }).catch(() => {});
      }
      reset();
      onSuccess?.(created.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer un modèle 3D" size="md">
      <div className="space-y-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          aria-hidden="true"
          tabIndex={-1}
          className="hidden"
          onChange={handleCameraFile}
        />

        <div className="text-xs text-gray-500 -mb-1">
          Ajoutez 1 à {MAX_FILES} photos du même objet sous différents angles
          pour un meilleur rendu 3D.
        </div>

        <UploadZone
          onFilesAccepted={handleFilesAccepted}
          maxFiles={MAX_FILES}
          currentCount={files.length}
          disabled={isUploading}
        />

        <div className="relative flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" />
          ou
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleCameraClick}
          disabled={isUploading || files.length >= MAX_FILES}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl',
            'bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50/30',
            'text-sm font-medium text-gray-700 transition-colors',
            (isUploading || files.length >= MAX_FILES) && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Camera className="w-4 h-4 text-brand-600" />
          Prendre une photo
        </button>

        {cameraError && (
          <p className="text-xs text-red-600 text-center">{cameraError}</p>
        )}

        {files.length > 0 && !isUploading && (
          <div className="grid grid-cols-2 gap-2">
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="relative group rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-2 flex items-center gap-2.5"
              >
                <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-gray-200 shrink-0">
                  {previews[idx] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previews[idx]}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate">{f.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {(f.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={`Retirer l'image ${idx + 1}`}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <>
            <Input
              label="Nom du modèle"
              placeholder="ex. Bouteille parfum Santal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="upload-object-type" className="text-sm font-medium text-gray-700">Type d&apos;objet</label>
              <select
                id="upload-object-type"
                aria-label="Type d'objet"
                title="Type d'objet"
                value={objectType}
                onChange={(e) => setObjectType(e.target.value as ObjectType)}
                disabled={isUploading}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:border-gray-300 transition-colors"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{OBJECT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {isUploading && (
          <p className="text-xs text-gray-500 text-center">
            Envoi en cours… La progression continuera dans le widget en bas à droite.
          </p>
        )}

        {uploadError && !isUploading && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {uploadError}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={isUploading} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isUploading}
            disabled={files.length === 0 || isUploading}
            className="flex-1"
          >
            Générer le modèle 3D
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default UploadModal;
