'use client';

import { useState } from 'react';
import { Box, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ModelCard } from '@/components/dashboard/ModelCard';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { useModels } from '@/lib/stores/modelsStore';
import { useUploadStore } from '@/lib/stores/uploadStore';
import { cn } from '@/lib/utils';

export default function ModelsPage() {
  const { models, loading, refresh } = useModels();
  const { startUpload, isUploading, uploadError } = useUploadStore();

  const [uploadOpen, setUploadOpen]         = useState(false);
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);
  const [modelName, setModelName]           = useState('');
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [creatingLinkId, setCreatingLinkId] = useState<string | null>(null);
  const [toast, setToast]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    if (!modelName) setModelName(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const result = await startUpload(selectedFile, modelName || selectedFile.name);
    if (result) {
      setUploadOpen(false);
      setSelectedFile(null);
      setModelName('');
      showToast('success', `"${result.name}" queued — see floating widget for live progress`);
    }
  };

  const handleModalClose = () => {
    if (isUploading) return;
    setUploadOpen(false);
    setSelectedFile(null);
    setModelName('');
  };

  const handleDelete = async (modelId: string) => {
    setDeletingId(modelId);
    try {
      const res = await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
        showToast('success', 'Model deleted');
      } else {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Failed to delete model');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateARLink = async (modelId: string) => {
    setCreatingLinkId(modelId);
    try {
      const res = await fetch('/api/ar-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      if (res.ok) {
        showToast('success', 'AR link created successfully');
      } else {
        const body = await res.json().catch(() => ({}));
        showToast('error', body.error ?? 'Failed to create AR link');
      }
    } finally {
      setCreatingLinkId(null);
    }
  };

  return (
    <DashboardShell
      title="3D Models"
      subtitle={`${models.length} model${models.length !== 1 ? 's' : ''}`}
      action={
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
      }
    >
      {/* Toast (light mode, top-right to avoid overlapping the floating widget) */}
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
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse shadow-sm">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-brand-50 border border-brand-100">
            <Box className="w-7 h-7 text-brand-500" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No 3D models yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Upload a product photo and our AI will generate a photorealistic 3D model in minutes.
          </p>
          <Button onClick={() => setUploadOpen(true)} size="lg">
            <Upload className="w-4 h-4" />
            Upload your first image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onDelete={() => handleDelete(model.id)}
              onCreateARLink={() => handleCreateARLink(model.id)}
              deleting={deletingId === model.id}
              creatingLink={creatingLinkId === model.id}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadOpen} onClose={handleModalClose} title="Generate 3D Model" size="md">
        <div className="space-y-4">
          <UploadZone onFileAccepted={handleFileAccepted} disabled={isUploading} />

          {selectedFile && !isUploading && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-gray-200 shrink-0">
                <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          {selectedFile && (
            <Input
              label="Model name"
              placeholder="e.g. Nike Air Max 90"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={isUploading}
            />
          )}

          {isUploading && (
            <p className="text-xs text-gray-500 text-center">
              Sending… progress will continue in the floating widget on the bottom right.
            </p>
          )}

          {uploadError && !isUploading && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={handleModalClose} disabled={isUploading} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={isUploading} disabled={!selectedFile || isUploading} className="flex-1">
              Generate 3D Model
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
