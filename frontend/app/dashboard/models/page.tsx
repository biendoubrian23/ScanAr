'use client';

import { useState } from 'react';
import { Box, Upload, Loader2, AlertCircle } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ModelCard } from '@/components/dashboard/ModelCard';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { useModels } from '@/hooks/useModels';
import { useUpload } from '@/hooks/useUpload';
import { cn } from '@/lib/utils';

// ─── Pipeline Steps ───────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'upload',     label: 'Upload',       progress: [0,   20]  },
  { key: 'queue',      label: 'Queue',         progress: [20,  60]  },
  { key: 'processing', label: 'AI Processing', progress: [60,  90]  },
  { key: 'export',     label: 'Export',        progress: [90,  99]  },
  { key: 'done',       label: 'Done',          progress: [100, 100] },
] as const;

function getStepStatus(stepIdx: number, progress: number): 'done' | 'active' | 'idle' {
  const step = PIPELINE_STEPS[stepIdx];
  if (progress >= step.progress[1]) return 'done';
  if (progress >= step.progress[0]) return 'active';
  return 'idle';
}

// ─── Models Page ──────────────────────────────────────────────────────────────

export default function ModelsPage() {
  const { models, loading, refresh } = useModels();
  const { upload, uploading, progress, error: uploadError } = useUpload();

  const [uploadOpen, setUploadOpen]  = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName]    = useState('');
  const [deletingId, setDeletingId]  = useState<string | null>(null);
  const [creatingLinkId, setCreatingLinkId] = useState<string | null>(null);
  const [toastMsg, setToastMsg]      = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    if (!modelName) setModelName(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const result = await upload(selectedFile, modelName || selectedFile.name);
    if (result) {
      setUploadOpen(false);
      setSelectedFile(null);
      setModelName('');
      showToast('success', `"${result.name}" queued for 3D processing`);
    }
  };

  const handleModalClose = () => {
    if (uploading) return;
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
      {/* Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-2xl shadow-black/40',
            'backdrop-blur-xl border',
            toastMsg.type === 'success'
              ? 'bg-green-500/15 border-green-500/30 text-green-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300',
          )}
        >
          {toastMsg.type === 'error' && (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toastMsg.text}
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
                <div className="h-3 w-1/3 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : models.length === 0 ? (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className={cn(
              'flex items-center justify-center w-20 h-20 rounded-3xl mb-6',
              'bg-gradient-to-br from-brand-600/20 to-brand-500/10',
              'border border-brand-500/20',
            )}
          >
            <Box className="w-9 h-9 text-brand-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            No 3D models yet
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs mb-8">
            Upload a product photo and our AI will generate a photorealistic 3D
            model in minutes.
          </p>
          <Button onClick={() => setUploadOpen(true)} size="lg">
            <Upload className="w-4 h-4" />
            Upload your first image
          </Button>
        </div>
      ) : (
        /* ── Models grid ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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

      {/* ── Upload Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={uploadOpen}
        onClose={handleModalClose}
        title="Generate 3D Model"
        size="md"
      >
        <div className="space-y-5">
          {/* Drop zone */}
          <UploadZone
            onFileAccepted={handleFileAccepted}
            disabled={uploading}
          />

          {/* File info + name input */}
          {selectedFile && !uploading && (
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{selectedFile.name}</p>
                <p className="text-xs text-zinc-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {selectedFile && (
            <Input
              label="Model name"
              placeholder="e.g. Nike Air Max 90"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={uploading}
            />
          )}

          {/* Pipeline steps */}
          {uploading && (
            <div className="space-y-3">
              <ProgressBar value={progress} showPercent color="brand" />
              <div className="flex items-center justify-between gap-1">
                {PIPELINE_STEPS.map((step, i) => {
                  const status = getStepStatus(i, progress);
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                          status === 'done' && 'bg-green-500/20 text-green-400 border border-green-500/30',
                          status === 'active' && 'bg-brand-600/20 text-brand-400 border border-brand-500/30',
                          status === 'idle' && 'bg-white/5 text-zinc-600 border border-white/10',
                        )}
                      >
                        {status === 'active' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : status === 'done' ? (
                          '✓'
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] text-center leading-tight',
                          status === 'active' && 'text-brand-400',
                          status === 'done' && 'text-green-400',
                          status === 'idle' && 'text-zinc-600',
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload error */}
          {uploadError && !uploading && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={handleModalClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              Generate 3D Model
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
