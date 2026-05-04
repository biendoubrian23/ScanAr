'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { useUploadStore } from '@/lib/stores/uploadStore';
import { OBJECT_TYPE_LABELS, type ObjectType } from '@/lib/types';

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

  const [file, setFile]             = useState<File | null>(null);
  const [name, setName]             = useState('');
  const [objectType, setObjectType] = useState<ObjectType>('object');

  const handleFileAccepted = (f: File) => {
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
  };

  const reset = () => {
    setFile(null);
    setName('');
    setObjectType('object');
  };

  const handleClose = () => {
    if (isUploading) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) return;
    const created = await startUpload(file, name || file.name);
    if (created) {
      // Persist the chosen object_type immediately (best-effort, fire-and-forget)
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
        <UploadZone onFileAccepted={handleFileAccepted} disabled={isUploading} />

        {file && !isUploading && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-gray-200 shrink-0">
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
          </div>
        )}

        {file && (
          <>
            <Input
              label="Nom du modèle"
              placeholder="ex. Bouteille parfum Santal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type d'objet</label>
              <select
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
            disabled={!file || isUploading}
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
